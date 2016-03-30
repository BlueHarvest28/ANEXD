package main

import (
	"encoding/json"
	"net/http"
	"fmt"
)

//The default part of all Failed responses.
func failMessage() (map[string]interface{}) {
	return map[string]interface{}{
		"code": 303,
		"status": "Fail",
	}
}

//The default part of all Success responses.
func successMessage() (map[string]interface{}) {
	return map[string]interface{}{
		"code": 100,
		"status": "Success",
	}
}

//Generate Response message when duplicate data is present.
func jsonDupKey(table string, message string) (string){
	f := failMessage()
	f["description"] = "Fail! Duplicate Key " + table + " exists"
	f["reason"] = message
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Generates message for when data is successfuly added
//and returns message with id of added data.
func jsonAdded(table string, id int64) (string){
	f := successMessage()
	f["description"] = "Success! "+ table +" has been added"
	f["id"] = id
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//An extension from function above that also returns some data information aswell.
//Often includes the id in the data map.
func jsonAddedData(table string, data map[string]interface{}) (string){
	f := successMessage()
	f["description"] = "Success! " + table + " has been added"
	f["data"] = data	
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Similar to jsonAddedData only adding single data item.
func jsonGetDataMap(table string, data map[string]interface{}) (string){
	f := successMessage()
	f["description"] = "Success! has " + table + "(s)"
	f["data"] = data	
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//very similar to jsonAddedData
func jsonGetData(table string, data interface{}) (string){
	f := successMessage()
	f["description"] = "Success! has a " + table
	f["data"] = data
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Generate message for when data is removed.
func jsonDeleted(table string, id interface{}) (string){
	f := successMessage()
	f["description"] = "Success! "+ table +" has been deleted"
	f["id"] = id
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Generate message for when were not sucessful with input information.
func jsonFail()(string){
	f := failMessage()
	f["description"] = "Fail! Information didn't match"
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Generate message for when data has been changed
func jsonChanged(table string)(string){
	f := successMessage()
	f["description"] = "Success! "+ table + " has been changed"
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Generate message for when data doesnt exist.
func jsonNtExist(table string) (string){
	f := failMessage()
	f["description"] = table + " doesnt exist"
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}


//Generates message for when auth expries
func jsonBadCookie() (string) {
	f := failMessage()
	f["description"] = "Cookie invalid please renew"
	f["code"] = 401
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

//Setting header for response and adding data
func writeJsonResponse(response string, w http.ResponseWriter){	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
}