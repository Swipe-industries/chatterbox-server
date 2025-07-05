# Following is the list of API and ✅ indicates that they have been completed

## authRoutes:
- POST      /auth/signup ✅
- POST      /auth/login ✅
- DELETE    /auth/logout ✅

## chatsRoutes:
- GET       /chat/user ✅
- GET       /chat/find/:receiverId (this is important because it involves pagination) [senderId will be taken from auth cookie]
- POST      /chat/create ✅ (I think there's no need of creating this API because "message:send" event handler in socket.io will take care of that. I mean it will try to insert the message into the message table and if not inserted then it means chat does not exist then create a chat and insert message into it )

## userRoutes:
- PATCH     /user/lastSeen ✅
- PATCH     /user/password ✅
- GET       /user/lastSeen/:userId ✅
- GET       /user/isUnique/:username ✅
- GET       /user/search ✅
- GET       /user/online/:userId 