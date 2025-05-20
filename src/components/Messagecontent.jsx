import React from 'react'

const Messagecontent = ({msg}) => {
  return (
    <>
       {/* Show text if available */}
       {msg.text && <div className="mb-2">{msg.text}</div>}
        
        {/* Show file/image if available */}
        {msg.fileUrl && (
          <div className="message-attachment">
            {msg.fileUrl.startsWith('data:image') ? (
              // If it's an image, show it
              <img 
                src={msg.fileUrl} 
                alt="Message attachment" 
                className="max-w-xs max-h-60 rounded"
              />
            ) : (
              // For other file types, show a download link
              <div className="file-attachment p-2 bg-gray-100 rounded flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <a 
                  href={msg.fileUrl} 
                  download={msg.fileName}
                  className="text-blue-600 hover:underline"
                >
                  {msg.fileName || "Download attachment"}
                </a>
              </div>
            )}
          </div>
        )}
        
        {/* Message timestamp */}
        <div className="text-xs mt-1 opacity-75">
          {msg.pending ? 'Sending...' : (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '')}
        </div>

    </>
  )
}

export default Messagecontent
