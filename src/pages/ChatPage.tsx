/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Tab, Tabs } from "@mui/material";
import ChatInterface from "../chat/ChatInterface";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import ChatsView from "../chat/ChatsView";

interface ChatPageProps {
  width: number;
  height: number;
}

const maxWidth = 1500;

function ChatPage({ width, height }: ChatPageProps) {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chatId") || undefined;

  const navigate = useNavigate();
  const handleSetChatId = useCallback((chatId: string | undefined) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (chatId) {
      newSearchParams.set("chatId", chatId);
    } else {
      newSearchParams.delete("chatId");
    }
    navigate(`${window.location.pathname}?${newSearchParams.toString()}`);
  }, [navigate, searchParams]);

  const [selectedTab, setSelectedTab] = useState(0);

  const handleChatUploaded = useCallback(
    () => {
      const newSearchParams = new URLSearchParams();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${newSearchParams.toString()}`
      );
      setSelectedTab(0);
    }, []);


  const topBubbleContent = useMemo(() => {
    return `Welcome to journalon.`
  }, []);

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", padding: 0, gap: 0 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons={true}
            allowScrollButtonsMobile={true}
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                py: 0,
                px: 1.5,
                minWidth: "auto",
              },
            }}
          >
            <Tab label="Chat" />
            <Tab label="Chats" />
          </Tabs>
        </Box>
      </Box>
      <Box
        sx={{
          display: selectedTab === 0 ? "block" : "none",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: Math.min(width, maxWidth),
        }}
      >
        <ChatInterface
          width={Math.min(width, maxWidth)}
          height={height}
          topBubbleContent={topBubbleContent}
          onChatUploaded={handleChatUploaded}
          chatId={chatId}
          setChatId={handleSetChatId}
        />
      </Box>
      <Box
        sx={{
          display: selectedTab === 2 ? "block" : "none",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: Math.min(width, maxWidth),
        }}
      >
        <ChatsView
          width={Math.min(width, maxWidth)}
          height={height - 50}
          onChatSelect={(chatId) => {
            window.location.href = `chatId=${chatId}`;
          }}
        />
      </Box>
    </>
  );
}

export default ChatPage;
