import Chat from "../models/Chat.js";

//api controller for creating new chat
export const createChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chatData = {
      userId,
      messages: [],
      name: "New Chat",
      userName: req.user.name,
    };
    await Chat.create(chatData);
    res.json({ success: true, message: "chat created" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//api controller for getting all chats
export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//api for deleting the chat
export const deleteChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.body;

    await Chat.deleteOne({ _id: chatId, userId });
    res.json({ success: true, message: "Chat Deleted successfully" });

    res.json({ success: true, chats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
