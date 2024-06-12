window.fetch = new Proxy(window.fetch, {
    async apply(actualFetch, that, args) {
        // Forward function call to the original fetch
        let bIntercept = false;
        var jsonObj = {};
        if ((args[0] || "").match(/^https?:\/\/.*\.aidungeon\.com\/graphql/i))
        {
            if ( args[1] && args[1]['headers'] && (args[1].headers['x-gql-operation-name'] || '').match(/^GetGameplayAdventure$/i) ) 
            {
                let body = JSON.parse(args[1]['body']);
                if (body && body['variables'] && !body.variables['offset'] ){
                    bIntercept = true;
                }
            }
        }

        const result = Reflect.apply(actualFetch, that, args);
        try {
            if (bIntercept) {
                let response = await result;
                var peek = response.clone();
                let bodyObj = await peek.json();
                if(bodyObj && bodyObj['data'] && bodyObj.data['adventure']) {
                    let jsonObj = bodyObj.data.adventure;
                    //let card = getV1CardTemplate();
                    //card.name = jsonObj['title'];
                    //card.scenario = jsonObj['modelContext'];
                    //card.description = jsonObj['authorsNote'];
                    //card.first_mes = getPrompt(jsonObj)
                    
                    //let elemDiv = document.querySelector('#gglChromeExtensionAidsExport');
                    //elemDiv.href = 'data:application/json;base64,' + btoa(JSON.stringify(card));
                    //elemDiv.download = card.name.replace(/[^\w \.]+/i, '_') + '.json';
                    window.postMessage({action: "gglChromeExtensionExport_cardready", data: jsonObj},"*");
                }
            }
        } catch( ex ) {
            console.log("An exeption ocurred while intercepting the fetch", ex);
        }
        return result;
    }
});

/*
var elemDiv = document.createElement('a');
elemDiv.id = 'gglChromeExtensionAidsExport';
elemDiv.innerText = 'Test';
elemDiv.style.cssText = 'display:none;';
elemDiv.href = "";
elemDiv.download="placeholder.json";
document.body.appendChild(elemDiv);
*/