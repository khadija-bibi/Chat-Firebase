import React, { useEffect, useState } from 'react'
import "./chatList.css";
import AddUser from './addUser/AddUser';
import {useUserStore} from "../../../lib/userStore"
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
const Chatlist = () => {
  const [addMode, setAddMode] = useState(false);
  const [chat, setChats] = useState([]);

  const{currentUser} = useUserStore();

  useEffect(()=>{
    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), (doc) => {
      setChats(doc.data())
  });
  return ()=>{
    unSub()
  }
  },[currentUser.id]);
  console.log(chat);
  
  return (
    <div className='chatList'>
        <div className="search">
            <div className="searchBar">
                <img src="./search.png" alt="" />
                <input type="text" placeholder='Search'/>
            </div>
            <img src={addMode ? "./minus.png" : "./plus.png"} 
            alt="" className='add' onClick={()=> setAddMode((prev) => !prev)}/>
        </div>
        <div className="item">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Ali Khan</span>
            <p>Hello</p>
          </div>
        </div>
        <div className="item">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Ali Khan</span>
            <p>Hello</p>
          </div>
        </div>
        <div className="item">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Ali Khan</span>
            <p>Hello</p>
          </div>
        </div>
        <div className="item">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Ali Khan</span>
            <p>Hello</p>
          </div>
        </div>
        <div className="item">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Ali Khan</span>
            <p>Hello</p>
          </div>
        </div>
        {addMode && <AddUser/>}
        
    </div>
  )
}

export default Chatlist