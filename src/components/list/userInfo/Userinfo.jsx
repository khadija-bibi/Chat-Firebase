import React from 'react'
import "./userInfo.css";
import userStore from '../../../lib/userStore';
const Userinfo = () => {
  const {currentUser}=userStore();
  return (

    <div className='userInfo'>
        <div className='user'>
            <img src={currentUser.avatar||"./avatar.png"} alt="" />
            <h5>{currentUser.username}</h5>
        </div>
        <div className="icons">
            <img src="./more.png" alt="" />
            <img src="./video.png" alt="" />
            <img src="./edit.png" alt="" />
            
        </div>
    </div>
  )
}

export default Userinfo