import React, { useEffect, useState, useRef } from 'react';
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../lib/firebase";
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const { chatId } = useChatStore();
  const { currentUser } = useUserStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  console.log(chat);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = async (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
      console.log("Image selected:", e.target.files[0]);

      // Automatically send the image after it's selected
      await handleSend();
    }
  };

  const upload = async (file) => {
    try {
      const storageRef = ref(storage, `images/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Optionally handle progress
          },
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("Image uploaded, URL:", downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting download URL:", error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error during upload:", error);
      throw error;
    }
  };

  const handleSend = async () => {
    console.log("Sending message...");

    if (!text.trim() && !img.file) {
      console.log("No text or image to send.");
      return;
    }

    let imgUrl = null;

    try {
      if (!chatId) {
        console.error("chatId is undefined");
        return;
      }

      const chatDocRef = doc(db, "chats", chatId);
      const chatDocSnap = await getDoc(chatDocRef);

      if (!chatDocSnap.exists()) {
        await setDoc(chatDocRef, { messages: [] });
      }

      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const messageData = {
        senderId: currentUser.id,
        createdAt: new Date(),
      };

      if (text.trim()) {
        messageData.text = text.trim();
      }

      if (imgUrl) {
        messageData.img = imgUrl;
      }

      if (messageData.text || messageData.img) {
        await updateDoc(chatDocRef, {
          messages: arrayUnion(messageData),
        });

        console.log("Message sent:", messageData);

        const userIds = [currentUser.id, chat?.userId];
        userIds.forEach(async (id) => {
          if (id) {
            const userChatRef = doc(db, "userchats", id);
            const userChatsSnapshot = await getDoc(userChatRef);

            if (userChatsSnapshot.exists()) {
              const userChatsData = userChatsSnapshot.data();
              const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

              if (chatIndex > -1) {
                userChatsData.chats[chatIndex].lastMessage = text.trim() || "Image";
                userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                userChatsData.chats[chatIndex].updatedAt = new Date().getTime();

                await updateDoc(userChatRef, {
                  chats: userChatsData.chats,
                });
              }
            }
          } else {
            console.error("Undefined userId encountered");
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setImg({ file: null, url: "" });
    setText("");
  };

  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Ali Khan</span>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map(message => (
          <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message?.createdAt}>
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        {img.url && <div className="message own">
          <div className="texts">
            <img src={img.url} alt="" />
          </div>
        </div>}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input type="file" id='file' style={{ display: 'none' }} onChange={handleImg} />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input type="text" value={text} placeholder='Type a message...' onChange={(e) => setText(e.target.value)} />
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button className='sendButton' onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
