# API ReadMe
Just a quick doc for the api and how to use it correctly.

To test the api to see if it is running navigate to http://api-anexd.rhcloud.com/test
This should show all the users currently in the database

All REST calls are done in POST format. The /test is the only get request purely for testing
purposes

## User table queries

####/newUser

This will be used for adding Main desktop users to the database. Normally after sign-up

This will be the payload all fields below are required.
```javascript
{
  "username": "xx",
  "password": "xx",
  "email" : "xx"
}
```
If the query is sucessful you will recieve a sucess response see below. Which will contain the id of the user.
An incorrect attempt will return a fail response with reason why.

####/getUser

This can be used to search for users

Payload for sign in should be as follows.
```javascript
{
  "email" : "xx"
}
```
or instead of email field username or userID may be used.

For retreving a user can use any one or combination of the fields.

####/login
This will be used for authorizing users that have already signed up. 

INPROGRESS: adding a session variable in the return.
This would then be used as auth with other api 

Payload for login should be as follows.
```javascript
{
  "password": "xx",
  "email" : "xx"
}
```

####/changePassword

For when the user wishes to change their password.

Payload
```javascript
{
  "userID": "xx",
  "password": "xx",
  "newpass" : "xx"
}
```

####/changeEmail
For when the user wishes to change their email.

Payload
```javascript
{
  "userID": "xx",
  "password": "xx",
  "email" : "xx"
}
```

####/changeUserData
This is combination of both /changeEmail & /changePassword

Payload "userID" and "password" are required
```javascript
{
  "userID": "xx",
  "password": "xx",
  "newpass" : "xx",
  "email" : "xx"
}
```
Note: you can also have one or the other like /changeEmail or /changePassword

####/delUser
This will remove the user from the database

Payload 
```javascript
{
  "userID": "xx"
}
```

## Anon User queries

####/newAnonUser
This is for the mobile users when they wish to connect to a lobby

Payload
```javascript
{
  "username": "xx",
  "lobbyID": "xx"
}
```

####/getAnonUser
If you wish to get an anon_user or users

Payload
```javascript
{
  "username": "xx"
}
```
Can use "username", "userID" and "lobbyID"

Note: using lobbyID will return all Anon users in that lobby.

####/delAnonUser
This will remove the anon user from the database

Payload 
```javascript
{
  "userID": "xx"
}
```

## Lobby table queries

####/newLobby
This is for creating a new Lobby

Payload all required except password
```javascript
{
  "title": "xx"
  "creator": "xx"
  "game": "xx"
  "size": "xx"
  "password": "xx"
}
```

####/getLobby
This is for getting information of a lobby.

Payload
```javascript
{
  "lobbyID": "xx",
  "title": "xx"
}
```
Can be any combination of the following "lobbyID","title","creator" and "game"

####/changeLobbyPassword
Similar to /changePassword of User but for when users are required to enter a lobby password

Payload
```javascript
{
  "lobbyID": "xx",
  "pass": "xx"
}
```

####/changeLobbySize
To change the size of the lobby so how many people it can hold

Payload
```javascript
{
  "lobbyID": "xx",
  "size": "xx"
}
```

####/delLobby
This will remove the lobby from the database

Payload 
```javascript
{
  "lobbyID"
}
```

## Game table queries

####/newGame
To create a new game.

Payload
```javascript
{
  "creatorID": "xx",
  "name": "xx"
  "type": "xx"
  "description": "xx"
  "image": "xx"
}
```
Note rating will be started off at 0.

####/changeGameData
If you wish to change any of the game information.

Payload
```javascript
{
  "gameID": "xx",
  "name": "xx"
}
```
You and use a one or more of "name", "rating", "type", "des" and "img"
With image must make sure it already exists or add the file.

## Response Types

Standard sucess message
```javascript
{
  "code": 100,
  "status": "sucess",
  "descript": "Sucess! Lobby Data was changed has been changed"
}
```
may vary have id if used with create REST API if using a get query then
will package in a data section.

Fail message
```javascript
{
  "code": 303,
  "status": "fail",
  "descript": "user doesnt exist"
}
```
