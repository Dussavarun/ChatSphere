import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-10 h-10 border-4 border-gray-700 border-t-white rounded-full animate-spin" />
    </div>
  );
};

export default Loader;
