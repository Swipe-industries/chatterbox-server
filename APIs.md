# Following is the list of API and ✅ indicates that they have been completed

## authRoutes:
- POST      /auth/signup ✅
- POST      /auth/login ✅
- DELETE    /auth/logout ✅

## chatsRoutes:
- GET       /chat/user ✅
- GET       /chat/find/:receiverId (this is important because it involves pagination) [senderId will be taken from auth cookie]
- POST      /chat/create ✅

## userRoutes:
- PATCH     /user/lastSeen ✅
- PATCH     /user/password ✅
- GET       /user/lastSeen/:userId ✅
- GET       /user/isUnique/:username ✅
- GET       /user/search ✅

## messageRoutes:
- POST      /message/send