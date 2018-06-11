(() => {
    class TaskKeeper
    {
        constructor()
        {
            this.register = [];
        }
        registerTask(identifier, callBack)
        {
            this.register.push({identifier: identifier, callBack: callBack});
        }
    }
    class WebWorker extends TaskKeeper
    {
        constructor()
        {
            super();
            this.worker = null;
            this.initWorker();
        }
        get workerBlob()
        {
            return new Blob([`
            onmessage = (message) => {
                let fn = new Function('return '+ message.data.fn)();
                Promise.resolve().then(() => {
                    let fnResult = fn();
                    postMessage({identifier: message.data.identifier, computedResult: fnResult});
                });
            };
        `],{type: 'text/javascript'});
        }
        initWorker()
        {
            this.worker = new Worker(window.URL.createObjectURL(this.workerBlob));
            this.worker.onmessage = (message) => {
                this.processCallback(message.data);
            };
            this.worker.onerror = (error) => {
                console.warn("WorkerError", error);
            };
        }
        processCallback(data)
        {
            let index = this.register.findIndex(x => x.identifier == data.identifier);
            this.register[index].callBack(data.computedResult);
            this.register.splice(index, 1);
        }
    }
    class WorkerJS extends WebWorker
    {
        constructor()
        {
            super()
        }
        addTask(fnName, fn, callback)
        {
            this.registerTask(fnName, callback);
            this.addToQueue({identifier: fnName, fn: fn.toLocaleString()});
        }
        addToQueue(task)
        {
            this.worker.postMessage(task);
        }
    }
    window.wjs = new WorkerJS();
})();
