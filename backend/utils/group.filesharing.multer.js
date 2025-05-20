import axios from "axios";

export const groupfilesharing = async({
   file , groupName ,input, userEmail , setFile , setMessages , API_BASE_URL
}) =>{
   const  apiBaseUrl = "http://localhost:3000"
   try{
      
      const messagetext = input.trim();
      const formData = new FormData();
      formData.append("userEmail", userEmail);
      formData.append("groupName" , groupName);
      formData.append("text", messagetext);

      if (file) {
      formData.append("file", file);
      }

      const response = await axios.post(`${apiBaseUrl}/group/fileupload` , formData);

      const { data } = response;
      const fileUrl = data?.data?.fileUrl || null;
      const fileName = data?.data?.fileName || null;
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          text: input,
          senderId: {
            email: userEmail,
            name: "Me"
          },
         fileUrl ,
         fileName ,
        //  createdAt : new  Date().toISOString()
        }
      ]);
      setFile(null);
   }catch(error){
     console.error("Error sending files in group message:", error);
   }

   console.log(`hello uploadfile multer`);
}