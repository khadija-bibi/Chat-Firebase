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

  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore(); // Destructure user from useChatStore
  const { currentUser } = useUserStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

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
          () => {},
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      throw error;
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !img.file) return;

    let imgUrl = null;

    try {
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
        text: text.trim(),
        img: imgUrl || null,
      };

      if (messageData.text || messageData.img) {
        await updateDoc(chatDocRef, {
          messages: arrayUnion(messageData),
        });

        const userIds = [currentUser.id, user?.id];
        userIds.forEach(async (id) => {
          if (id) {
            const userChatRef = doc(db, "userchats", id);
            const userChatsSnapshot = await getDoc(userChatRef);

            if (userChatsSnapshot.exists()) {
              const userChatsData = userChatsSnapshot.data();
              const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

              if (chatIndex > -1) {
                userChatsData.chats[chatIndex].lastMessage = messageData.text || "Image";
                userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
                userChatsData.chats[chatIndex].updatedAt = new Date().getTime();

                await updateDoc(userChatRef, {
                  chats: userChatsData.chats,
                });
              }
            }
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
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
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
        <input type="text" value={text} placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You cannot send a message": 'Type a message...'} disabled={isCurrentUserBlocked || isReceiverBlocked}onChange={(e) => setText(e.target.value)} />
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button className='sendButton' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
