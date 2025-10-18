"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function ChatSection({ projectId }: { projectId: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  return (
    <div className="stretch mx-auto flex w-full max-w-md flex-col py-24">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await sendMessage(
            {
              text: input,
              metadata: { projectId },
            },
            {
              body: { projectId },
            },
          );
          setInput("");
        }}
      >
        <input
          className="fixed bottom-0 mb-8 w-full max-w-md rounded border border-zinc-300 p-2 shadow-xl dark:border-zinc-800"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
