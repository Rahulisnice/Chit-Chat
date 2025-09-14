import React, { useEffect } from "react";
import { assets } from "../assets/assets";
import moment from "moment";
import Markdown from "react-markdown";
import Prism from "prismjs";

const Message = ({ message }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  return (
    <div className="my-4 flex w-full">
      {message.role === "user" ? (
        <div className="ml-auto flex items-end gap-2 max-w-[70%]">
          <div className="flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md">
            <p className="text-sm dark:text-primary break-words">
              {message.content}
            </p>
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
          <img src={assets.user_icon} className="rounded-full w-8" alt="you" />
        </div>
      ) : (
        <div className="mr-auto flex items-start gap-2 max-w-[70%]">
          {/* optional: bot avatar */}
          <div className="flex flex-col gap-2 p-2 px-4 bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md">
            {message.isImage ? (
              <img
                src={message.content}
                className="w-full max-w-md mt-2 rounded-md"
                alt="generated"
              />
            ) : (
              <div className="text-sm dark:text-primary break-words">
                <Markdown>{message.content}</Markdown>
              </div>
            )}
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
