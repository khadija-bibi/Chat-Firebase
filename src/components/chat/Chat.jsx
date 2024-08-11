import React, { useEffect, useState, useRef } from 'react'
import "./chat.css";
import EmojiPicker from "emoji-picker-react"
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
const Chat = () => {
  const [chat, setChat]=useState();
  const [open, setOpen]=useState(false);
  const [text, setText]=useState("");

  const { chatId } = useChatStore();
  const { currentUser } = useUserStore();

  const endRef = useRef(null);
  useEffect(()=>{
    endRef.current?.scrollIntoView({behavior:"smooth"})
  },[])

  useEffect(()=>{
    const unSub = onSnapshot(doc(db,"chats", chatId), (res)=>{
      setChat(res.data())
    })

    return()=>{
      unSub();
    }
  },[chatId]);

  console.log(chat);
  

  const handleEmoji = (e)=>{
    setText((prev)=>prev + e.emoji);
    setOpen(false);
  }

  const handleSend = async () => {
  if (text === "") return;

  try {
    // Check if the chat document exists
    const chatDocRef = doc(db, "chats", chatId);
    const chatDocSnap = await getDoc(chatDocRef);

    if (!chatDocSnap.exists()) {
      // Create the chat document if it doesn't exist
      await setDoc(chatDocRef, {
        messages: [],
      });
    }

    // Now update the chat document with the new message
    await updateDoc(chatDocRef, {
      messages: arrayUnion({
        senderId: currentUser.id,
        text,
        createdAt: new Date(),
      }),
    });

    const userIds = [currentUser.id, chat.userId]; // Ensure chat.userId exists and is correct

    userIds.forEach(async (id) => {
      const userChatRef = doc(db, "userchats", id);
      const userChatsSnapshot = await getDoc(userChatRef);

      if (userChatsSnapshot.exists()) {
        const userChatsData = userChatsSnapshot.data();

        const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

        if (chatIndex > -1) {
          
          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id? true:false;
          userChatsData.chats[chatIndex].updatedAt = new Date().getTime();

          await updateDoc(userChatRef, {
            chats: userChatsData.chats,
          });

        } 
      }
    });

    setText(""); // Clear the input after sending the message
  } catch (error) {
    console.error("Error sending message:", error);
  }
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
        
        {chat?.messages?.map(message=>(
          <div className="message own" key={message?.createdAt}>
            <div className="texts">
              {message.img&& <img src={message.img} alt="" />}
             
             <p>{message.text}</p>
             {/* <span>{message}</span> */}
            </div>
          </div>
        ))
         }
        
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <img src="./img.png" alt="" />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input type="text" value={text} placeholder='Type a message...' onChange={(e)=>setText(e.target.value)}/>
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={()=> setOpen((prev) => !prev)}/>
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button className='sendButton' onClick={handleSend}>Send</button>
      </div>
    </div>
  )
}

export default Chat