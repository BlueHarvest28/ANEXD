package main

import (
	"encoding/json"
	"net/http"
	"fmt"
)

func jsonDupKey(table string, message string) (string){
	return `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Duplicate Key ` + table + ` exists",`+
				`"reason" : "` + message + `"` +
			`}`
}

func jsonAdded(table string, id int64) (string){
	var f = map[string]interface{}{
		"code": 100,
		"status": "sucess",
		"descript": "Sucess! "+ table +" has been added",
		"id": id,
	}
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

func jsonAddedData(table string, data map[string]interface{}) (string){
	var f = map[string]interface{}{
		"code": 100,
		"status": "sucess",
		"descript": "Sucess! "+ table +" has been added",
	}
	for key, value := range data{
		f[key] = value
	}	
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

func jsonDeleted(table string, id float64) (string){
	var f = map[string]interface{}{
		"code": 100,
		"status": "sucess",
		"descript": "Sucess! "+ table +" has been deleted",
		"id": id,
	}
	b, err := json.Marshal(f)
	checkErr("Parsing data to json: ", err)
	return string(b)
}

func jsonFail()(string){
	return `{`+
			`"code" : 303, `+
			`"status" : "fail",`+
			`"descript" : "Fail! Information didn't match"`+
			`}`
}

func jsonChanged(table string)(string){
	return `{` +
			`"code" : 100, `+
			`"status" : "sucess",`+
			`"descript" : "Sucess! ` + table + ` has been changed"`+
		`}`
}

//Setting header for response and adding data
func writeJsonResponse(response string, w http.ResponseWriter){	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
}