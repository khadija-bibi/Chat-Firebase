import React, { useState } from 'react';
import './login.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase'; // Adjust the import path
import {doc, setDoc} from 'firebase/firestore';
import upload from '../../lib/upload';
const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });
    const [loading, setLoading] = useState(false);

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);
        
        // console.log("Password:", password);

        try {
            
            await signInWithEmailAndPassword(auth, email,password)
            toast.success("Login successfully!");

        } catch (error) {
            console.log(error);
            toast.error(err.message);

        } finally{
            setLoading(false);
        }

    }

    const handleRegister = async (e) => {
        e.preventDefault();

        setLoading(false);

        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);
        
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);

            const imgUrl = await upload(avatar.file)
            await setDoc(doc(db, "users", res.user.uid),{
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked:[],
            });

            await setDoc(doc(db, "userchats", res.user.uid),{
                chats: [],
            });
            toast.success("Account created successfully!");

        } catch (err) {
            
            toast.error(err.message);
        }
        finally{
            setLoading(false);
        }
    }

    return (
        <div className='login'>
            <div className="item">
                <h2>Welcome back,</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder='Email' name='email' />
                    <input type="password" placeholder='Password' name='password' />
                    <button disabled={loading}>{loading ? "loading":"Sign In"}</button>
                </form>
            </div>
            <div className="separator"></div>
            <div className="item">
                <h2>Create an Account</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="" />
                        Upload an Image
                    </label>
                    <input type="file" id='file' onChange={handleAvatar} style={{ display: "none" }} />
                    <input type="text" placeholder='Username' name='username' />
                    <input type="text" placeholder='Email' name='email' />
                    <input type="password" placeholder='Password' name='password' />
                    <button disabled={loading}>{loading ? "loading":"Sign Up"}</button>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}

export default Login;
