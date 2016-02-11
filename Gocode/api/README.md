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

This will be used for authorizing users that have already signed up. It can also be used for other means

Payload for sign in should be as follows.
```javascript
{
  "password": "xx",
  "email" : "xx"
}
```
or instead of email field username may be used.

For retreving a user can use any one or combination of the fields.

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

####/newLobbyPassword
Similar to /changePassword of User but for when users are required to enter a lobby password

Payload
```javascript
{
  "lobbyID": "xx",
  "pass": "xx"
}
```

DEPRECATED
####/newLobbyTitle
To change the title of the lobby

Payload
```javascript
{
  "lobbyID": "xx",
  "pass": "xx"
}
```

####/newLobbySize
To change the size of the lobby so how many people it can hold

Payload
```javascript
{
  "lobbyID": "xx",
  "size": "xx"
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
may vary have id if used with create REST API

Fail message
```javascript
{
  "code": 303,
  "status": "fail",
  "descript": "user doesnt exist"
}
```