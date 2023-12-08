const { llama } = require('./completion.js');

const request = llama("This is a conversation between user and llama, a friendly chatbot.", {
    frequency_penalty: 0, 
    mirostat: 0, 
    mirostat_eta: 0.1,
    mirostat_tau: 5,
    n_predict: 400,
    presence_penalty: 0,
    repeat_last_n: 256,
    repeat_penalty: 1.18,
    prompt: "How are you?",
    stop: ["</s>", "llama:", "User:"],
    stream: true,
    temperature: 0.54,
    tfs_z: 1,
    top_k: 40,
    top_p: 0.5,
    typical_p: 1
}, {
    aborted: false,
    onabort: null,
    reason: undefined
}
)

const run = async () => {
    let str = "";

    for await (const chunk of request) {
        str += chunk.data.content;
    }

    console.log(str);
}

run();