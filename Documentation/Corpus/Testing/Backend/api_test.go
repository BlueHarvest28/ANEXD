package anxedapi

import (
	"testing"
	"encoding/json"
	"time"
)

//TODO
//test json exaushtivaly so good bad cases

//------------------------------------------\\
//				      Api                   \\
//------------------------------------------\\

func TestRandStringRunes(t *testing.T) {
	var count int = 100
	
	for i:= 1; i<= count; i++ {
		args := RandStringRunes(i)
		if len(args) != i {
			t.Error(
				"For", "RandStringRunes",
				"should be length", i,
				"was length", len(args),
				"value", args,
			)
		}
	}
}

// func RequiredVariables(vars []string, params map[string]interface{}, qStr *string) ([]interface{}) {
func TestRequiredVariables(t *testing.T) {
	qStr := "Select * FROM Game WHERE "
	
	params := map[string]interface{}{
		"name": "tester",
		"size": 11,
		"badname": "notused",
	}
	
	args := RequiredVariables([]string{"name","size"}, params, nil)
	conv, _ := json.Marshal(args)
	mes := string(conv)
	
	args1 := RequiredVariables([]string{"name","size"}, params, &qStr)
	conv, _ = json.Marshal(args1)
	mes1 := string(conv)
	
	//testing params
	qStrTest := "Select * FROM Game WHERE name = ? AND size = ? "
	usedParams := []interface{}{"tester", 11}
	conv, _ = json.Marshal(usedParams)
	realMes := string(conv)
	
	if mes != realMes ||
	   mes1 != realMes ||
	   qStr != qStrTest{
		t.Error(
			"For", "RequiredVariables",
			"expected", realMes, "qStr", qStrTest,
			"got", mes, mes1, "qStr", qStr,
		)
	}
}

//------------------------------------------\\
//				     User                   \\
//------------------------------------------\\

var arg, arg1 string

func TestCheckedLogged(t *testing.T) {	
	arg  = addLogged()
	arg1 = addLogged()
	
	//change time to make it over 2days ago
	logged[arg1] = time.Now().UnixNano() - int64(49 * time.Hour)
	
	if checkLogged(arg) || !checkLogged(arg1) {
		t.Error(
			"For", "checkedLogged",
			"arg should be true", checkLogged(arg),
			"arg1 should be false", checkLogged(arg1),
		)
	}
}


func TestAddLogged(t *testing.T) {
	newargs := addLogged()
	if len(logged) != 2{
		t.Error(
        "For", "addLogged",
        "size should be 2", arg, newargs,
		"arg1 should be removed", arg1,
        "was", logged,
      )
	}
}

//------------------------------------------\\
//				    Lobby                   \\
//------------------------------------------\\

func TestNewRandStr(t *testing.T) {
	for i:=0; i<1000; i++ {
		args := newRandStr()
		if len(args) != 6 {
			t.Error(
				"For", "newRandStr",
				"should be 6 long was ", args,
			)
		}
	}
}

//------------------------------------------\\
//				 JsonResTypes               \\
//------------------------------------------\\


func TestFailMessage(t *testing.T) {
	conv, _ := json.Marshal(failMessage())
	mes := string(conv)
	
	realMesJson := map[string]interface{}{
		"code": 303,
		"status": "Fail",
	}
	conv, _ = json.Marshal(realMesJson)
	realMes := string(conv)

	if mes != realMes {
      t.Error(
        "For", "failMessage",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestSuccessMessage(t *testing.T) {
    conv, _ := json.Marshal(successMessage())
	mes := string(conv)
	
	realMesJson := map[string]interface{}{
		"code": 100,
		"status": "Success",
	}
	conv, _ = json.Marshal(realMesJson)
	realMes := string(conv)

	if mes != realMes {
      t.Error(
        "For", "successMessage",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestJsonDupKey(t *testing.T) {
	mes := jsonDupKey("User", "User table dup key error on userID")
	
	realMesJson := map[string]interface{}{
		"code": 303,
		"status": "Fail",
		"description": "Fail! Duplicate Key User exists",
		"reason": "User table dup key error on userID",
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonDupKey",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestJsonAdded(t *testing.T){
	mes := jsonAdded("Lobby", 32)
	
	realMesJson := map[string]interface{}{
		"code": 100,
		"status": "Success",
		"description": "Success! Lobby has been added",
		"id": 32,
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonAdded",
        "expected", realMes,
        "got", mes,
      )
    }	
}

func TestJsonAddedData(t *testing.T) {
	mes := jsonAddedData("Game", map[string]interface{}{"name": "game1", "size": 10})
	
	realMesJson := map[string]interface{}{
		"code": 100,
		"status": "Success",
		"description": "Success! has Game(s)",
		"data": map[string]interface{}{
			"name": "game1",
			"size": 10,
		},
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonAddedData",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestJsonGetData(t *testing.T) {
	mes := jsonGetData("User", map[string]interface{}{"name": "gary", "pass": "itssecret"})
	
	realMesJson := map[string]interface{}{
		"code": 100,
		"status": "Success",
		"description": "Success! has a User",
		"data": map[string]interface{}{
			"name": "gary",
			"pass": "itssecret",
		},
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonGetData",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestJsonDeleted(t *testing.T) {
	mes := jsonDeleted("Game", 46)
	
	realMesJson := map[string]interface{}{
		"code": 100,
		"status": "Success",
		"description": "Success! Game has been deleted",
		"id": 46,
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonDeleted",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestJsonFail(t *testing.T) {
	mes := jsonFail()
	
	realMesJson := map[string]interface{}{
		"code": 303,
		"status": "Fail",
		"description": "Fail! Information didn't match",
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonFail",
        "expected", realMes,
        "got", mes,
      )
    }
}

func TestJsonChanged(t *testing.T) {
	mes := jsonChanged("Lobby")
	
	realMesJson := map[string]interface{}{
		"code": 100,
		"status": "Success",
		"description": "Success! Lobby has been changed",
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonChanged",
        "expected", realMes,
        "got", mes,
      )
    } 	
}

func TestJsonNtExist(t *testing.T) {
	mes := jsonNtExist("Game")
	
	realMesJson := map[string]interface{}{
		"code": 303,
		"status": "Fail",
		"description": "Game doesnt exist",
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonNtExist",
        "expected", realMes,
        "got", mes,
      )
    } 
}

func TestJsonBadCookie(t *testing.T) {
	mes := jsonBadCookie()
	
	realMesJson := map[string]interface{}{
		"code": 401,
		"status": "Fail",
		"description": "Cookie invalid please renew",
	}
	conv, _ := json.Marshal(realMesJson)
	realMes := string(conv)
	
	if mes != realMes {
      t.Error(
        "For", "jsonBadCookie",
        "expected", realMes,
        "got", mes,
      )
    } 
}