import React from "react";
import LoginForm from "./auth/LoginForm";

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
};

export default Home;
