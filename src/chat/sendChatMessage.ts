import { getAllTools } from "./allTools";
import { AVAILABLE_MODELS } from "./availableModels";
import {
  ORMessage,
  ORNonStreamingChoice,
  ORRequest,
  ORResponse,
  ORToolCall,
} from "./openRouterTypes";

const constructInitialSystemMessages = async () => {
  let message1 = ``;

  // Note: the phrase "journal"
  // is checked on the backend.
  message1 += `You are a daily journal coach who is helpful and encouraging but not annoying. Keep your responses relatively short. The main purpose is to keep a journal log and get some nice feedback along the way. This app is called journalon.`;

  const tools = await getAllTools();
  for (const a of tools) {
    message1 += `## Tool: ${a.toolFunction.name}\n`;
    message1 += await a.getDetailedDescription() + "\n";
    message1 += "\n";
  }

  return [message1];
};

export type ChatMessageResponse = {
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    cost: number;
  };
};

export const sendChatMessage = async (
  messages: ORMessage[],
  model: string,
  o: {
    onUpdate: (pendingMessages: ORMessage[], newMessages: ORMessage[]) => void;
    askPermissionToRunTool: (toolCall: ORToolCall) => Promise<boolean>;
    setToolCallForCancel: (toolCall: ORToolCall | "completion" | undefined, onCancel: (() => void) | undefined) => void;
    openRouterKey?: string;
  }
): Promise<ChatMessageResponse> => {
  // Create system message with tool descriptions
  const msgs = await constructInitialSystemMessages();
  const initialSystemMessages: ORMessage[] = msgs.map((m) => ({
    role: "system",
    content: m,
  }));

  const messages1 = [...messages];

  const request: ORRequest = {
    model: model,
    messages: [...initialSystemMessages, ...messages],
    stream: false,
    tools: (await getAllTools()).map((tool) => ({
      type: "function",
      function: tool.toolFunction,
    })),
  };

  let result;
  const controller = new AbortController();
  o.setToolCallForCancel("completion", () => {
    controller.abort();
  });
  try {
    result = await fetchCompletion(request, {
      openRouterKey: o.openRouterKey,
      signal: controller.signal,
    });
    o.setToolCallForCancel(undefined, undefined);
  }
  catch (e) {
    o.onUpdate(messages1, [
      {
        role: "system",
        content: `Error in call to OpenRouter API: ${e}`,
      },
    ]);
    o.setToolCallForCancel(undefined, undefined);
    return {};
  }

  const choice = result.choices[0];

  if (!choice) {
    const msg: ORMessage = {
      role: "system",
      content: "Error in call to OpenRouter API. No choices returned.",
    }
    messages1.push(msg);
    o.onUpdate(messages1, [msg]);
    return {};
  }

  const prompt_tokens = !result.cacheHit ? result.usage?.prompt_tokens || 0 : 0;
  const completion_tokens = !result.cacheHit
    ? result.usage?.completion_tokens || 0
    : 0;

  const a = AVAILABLE_MODELS.find((m) => m.model === model);
  const cost =
    ((a?.cost.prompt || 0) * prompt_tokens) / 1_000_000 +
    ((a?.cost.completion || 0) * completion_tokens) / 1_000_000;

  // note that we don't include the system message for AI context in this one
  // const updatedMessages = [...messages];

  // actually we do
  let updatedMessages = [...messages1];
  const newMessages: ORMessage[] = [];
  o.onUpdate(updatedMessages, newMessages);

  // Check if it's a non-streaming choice with message
  if ("message" in choice && choice.message) {
    const message = choice.message;

    const toolCalls = message.tool_calls;
    if (toolCalls !== undefined && toolCalls.length > 0) {
      // First add the assistant's message with tool calls
      const assistantMessage: ORMessage = {
        role: "assistant",
        content: null,
        tool_calls: toolCalls,
      };
      updatedMessages.push(assistantMessage);
      newMessages.push(assistantMessage);
      o.onUpdate(updatedMessages, newMessages);

      const tools = await getAllTools();
      let canceled = false;
      for (const tc of toolCalls) {
        if (canceled) {
          break;
        }
        const tool = tools.find(
          (tool) => tool.toolFunction.name === tc.function.name
        );
        o.setToolCallForCancel(undefined, undefined);
        if (!tool) {
          console.error(`Tool ${tc.function.name} not found`);
          continue;
        }
        const okayToRun = await o.askPermissionToRunTool(tc);
        if (okayToRun) {
          const onCancelRef: {
            onCancel?: () => void
          } = {
            onCancel: undefined
          };
          if (tool.isCancelable) {
            o.setToolCallForCancel(tc, () => {
              if (onCancelRef.onCancel) {
                canceled = true;
                onCancelRef.onCancel(); // communicates the cancel to the tool execution
              }
            });
          }
          const toolResult = await handleToolCall(tc, {
            // imageUrlsNeedToBeUser: model.startsWith("openai/") || model.startsWith("anthropic/"),
            imageUrlsNeedToBeUser: true,
            onCancelRef
          });
          const toolMessage: ORMessage = {
            role: "tool",
            content: toolResult.result,
            tool_call_id: tc.id,
          };
          updatedMessages.push(toolMessage);
          newMessages.push(toolMessage);
          if (toolResult.newMessages) {
            updatedMessages.push(...toolResult.newMessages);
            newMessages.push(...toolResult.newMessages);
          }
          o.onUpdate(updatedMessages, newMessages);
        } else {
          const toolMessage: ORMessage = {
            role: "tool",
            content: "Tool execution was not approved by the user.",
            tool_call_id: tc.id,
          };
          updatedMessages.push(toolMessage);
          newMessages.push(toolMessage);
          o.onUpdate(updatedMessages, newMessages);
          break;
        }
      }
      o.setToolCallForCancel(undefined, undefined);

      let shouldMakeAnotherRequest = false;
      // only make another request if not canceled and there was a tool call that was not interact_with_app
      if (!canceled) {
        for (const toolCall of toolCalls) {
          if (
            toolCall.type === "function" &&
            toolCall.function.name !== "interact_with_app"
          ) {
            shouldMakeAnotherRequest = true;
            break;
          }
        }
      }

      if (!shouldMakeAnotherRequest) {
        o.onUpdate(updatedMessages, newMessages);
        return {
          usage: {
            prompt_tokens,
            completion_tokens,
            cost,
          },
        };
      }
      // Make another request with the updated messages
      let newMessagesFromNextRequest: ORMessage[] = [];
      const rr = await sendChatMessage(updatedMessages, model, {
        ...o,
        onUpdate: (pendingMessages0: ORMessage[], newMessages0: ORMessage[]) => {
          newMessagesFromNextRequest = newMessages0;
          updatedMessages = pendingMessages0;
          o.onUpdate(pendingMessages0, [...newMessages, ...newMessages0]);
        }
      });
      o.onUpdate(updatedMessages, [...newMessages, ...newMessagesFromNextRequest]);
      return {
        usage: rr.usage
          ? {
              prompt_tokens: prompt_tokens + rr.usage.prompt_tokens,
              completion_tokens: completion_tokens + rr.usage.completion_tokens,
              cost: cost + rr.usage.cost,
            }
          : undefined,
      };
    }

    // For regular messages, just add the assistant's response
    const assistantMessage: ORMessage = {
      role: "assistant",
      content: message.content || "[NO CONTENT]",
      name: undefined, // Optional name property
    };
    updatedMessages.push(assistantMessage);
    newMessages.push(assistantMessage);
  }

  o.onUpdate(updatedMessages, newMessages);
  return {
    usage: {
      prompt_tokens,
      completion_tokens,
      cost,
    },
  };
};

export const fetchCompletion = async (
  request: ORRequest,
  o: {
    openRouterKey?: string;
    signal?: AbortSignal;
  }
): Promise<ORResponse & { cacheHit?: boolean }> => {
  let response;
  if (o.openRouterKey) {
    // directly hit the OpenRouter API
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    response = await fetch(
      OPENROUTER_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${o.openRouterKey}`,
        },
        body: JSON.stringify(request),
        signal: o.signal,
      }
    );
  }
  else {
    response = await fetch(
      "https://journalon-api.vercel.app/api/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(o.openRouterKey ? { "x-openrouter-key": o.openRouterKey } : {}), // leave this as is in case we want to always route through the api
        },
        body: JSON.stringify(request),
        signal: o.signal,
      }
    );
  }

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const result = (await response.json()) as ORResponse;

  // important to do these checks prior to caching
  if (!result.choices) {
    console.warn(result);
    throw new Error("No choices in response");
  }
  if (result.choices.length === 0) {
    console.warn(result);
    throw new Error("No choices in response (length 0)");
  }

  // don't cache empty responses
  const choice = result.choices[0] as ORNonStreamingChoice;
  if (!choice.message.content && !choice.message.tool_calls) {
    console.warn(choice);
    console.warn("Got empty response");
  }

  return result;
};

const handleToolCall = async (
  toolCall: ORToolCall,
  o: {
    imageUrlsNeedToBeUser: boolean;
    onCancelRef: {
      onCancel?: () => void;
    }
  }
): Promise<{
  result: string;
  newMessages?: ORMessage[];
}> => {
  if (toolCall.type !== "function") {
    throw new Error(`Unsupported tool call type: ${toolCall.type}`);
  }

  const { name, arguments: argsString } = toolCall.function;
  const tools = await getAllTools();
  const executor = tools.find(
    (tool) => tool.toolFunction.name === name
  )?.execute;

  if (!executor) {
    throw new Error(`No executor found for tool: ${name}`);
  }

  try {
    const args = JSON.parse(argsString);
    return await executor(args, {
      imageUrlsNeedToBeUser: o.imageUrlsNeedToBeUser,
      onCancelRef: o.onCancelRef
    });
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    throw error;
  }
};

const globalData: {
  aiContext: string;
  notebookContent: string;
  parentWindowContext: string;
} = {
  aiContext: "",
  notebookContent: "",
  parentWindowContext: "",
};

// Listen for messages from parent window
if (window.parent !== window) {
  window.addEventListener("message", (event) => {
    // Validate message origin here if needed
    if (event.data?.type === "nbfiddle_parent_context") {
      globalData.parentWindowContext = event.data.context;
    }
  });
}