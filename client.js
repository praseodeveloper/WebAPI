var fqdn = `http://${window.location.hostname}:8000`;

function createTables() {
    fetch(`${fqdn}/createTables`).then(function (response) {
        // The API call was successful!
        if (response.ok) {
            return response.json();
        } else {
            return Promise.reject(response);
        }
    }).then(function (data) {
        console.log(data);
    }).catch(function (err) {
        // There was an error
        console.warn('Something went wrong.', err);
    });;
}

function getAPIKeyBtnPressed() {
    //alert("Get API key!");
    var email = document.getElementById("emailInput").value;
    if (email) {
        fetch(`${fqdn}/getApiKey`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                email: encodeURI(email)
            })
        }).then(function (response) {
            // The API call was successful!
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(response);
            }
        }).then(function (data) {
            document.getElementById("apiKeyLabel").innerText = data.apiKey;
            // This is the JSON from our response
            console.log(data);
        }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong.', err);
        });
    } else {
        alert("Please enter valid email");
    }
}

function getAllAssignedKeysBtnPressed() {
    fetch(`${fqdn}/getAllKeys`).then(function (response) {
        // The API call was successful!
        if (response.ok) {
            return response.json();
        } else {
            return Promise.reject(response);
        }
    }).then(function (data) {
        var values = data.keys.map((row) => row.email + " " + row.key);
        document.getElementById("allKeysTextArea").value = values.join("\n");

        // });
        // document.getElementById("allKeysTextArea").value = data.keys;
        // This is the JSON from our response
        console.log(data);
    }).catch(function (err) {
        // There was an error
        console.warn('Something went wrong.', err);
    });
}

function getMyUsageBtnPressed() {
    var email = document.getElementById("emailInput").value;
    if (email) {
        fetch(`${fqdn}/getMyUsage`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                email: encodeURI(email)
            })
        }).then(function (response) {
            // The API call was successful!
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(response);
            }
        }).then(function (data) {
            var table = document.getElementById("myUsageTable");

            while( table.rows.length > 1) table.rows[1].remove();
            data.usage.forEach((row) => {
                var tbdy = document.createElement('tbody');
                const tr = table.insertRow();
                const td1 = tr.insertCell();
                td1.appendChild(document.createTextNode(row.key));
                const td2 = tr.insertCell();
                td2.appendChild(document.createTextNode(row.endpoint));
                table.appendChild(tbdy);
            });
            // var values = data.usage.map((row) => row.key + " " + row.endpoint);
            // document.getElementById("myUsageTextArea").value = values.join("\n");

            // });
            // document.getElementById("allKeysTextArea").value = data.keys;
            // This is the JSON from our response
            console.log(data);
        }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong.', err);
        });
    } else {
        alert("Please enter valid email");
    }
}