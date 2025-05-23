import React, { useState } from 'react';

const Messagecontent = ({ msg, onDelete }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative max-w-fit px-4 py-2 rounded-lg transition duration-200 ${
        hovered ? 'bg-gray-100' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 🗑 Delete Button */}
      {hovered && (
        <button
          onClick={() => onDelete(msg.id)}
          className="absolute top-1 right-1 text-xs bg-red-500 text-white px-2 py-1 rounded-full shadow-sm hover:bg-red-600 transition"
        >
          Delete
        </button>
      )}

      {/* Text Message */}
      {msg.text && (
        <div className="text-gray-900 mb-1">{msg.text}</div>
      )}

      {/* File/Image */}
      {msg.fileUrl && (
        <div className="mt-1">
          {msg.fileUrl.startsWith('data:image') ? (
            <img
              src={msg.fileUrl}
              alt="Attachment"
              className="max-w-xs max-h-60 rounded-lg"
            />
          ) : (
            <div className="p-2 bg-gray-100 rounded flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <a
                href={msg.fileUrl}
                download={msg.fileName}
                className="text-blue-600 hover:underline"
              >
                {msg.fileName || "Download file"}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 mt-2">
        {msg.pending ? 'Sending...' : (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '')}
      </div>
    </div>
  );
};

export default Messagecontent;
