window.fetch = new Proxy(window.fetch, {
    async apply(actualFetch, that, args) {
        // Forward function call to the original fetch

        try {
            let bIntercept = false;
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
            if (bIntercept) {
                let response = await result;
                var peek = response.clone();
                let bodyObj = await peek.json();
                if(bodyObj && bodyObj['data'] && bodyObj.data['adventure']) {
                    let jsonObj = bodyObj.data.adventure;
                    window.postMessage({action: "gglChromeExtensionExport_cardready", data: jsonObj},"*");
                }
            }
            return result;
        } catch( ex ) {
            console.log("An exeption ocurred while intercepting the fetch", ex);
            return Reflect.apply(actualFetch, that, args);
        }
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