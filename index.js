import {fileURLToPath} from "url";
import path from "path";
import {LlamaModel, LlamaContext, LlamaChatSession} from "node-llama-cpp";
import fs from "fs";
import { glob } from "glob";
import Queue from 'queue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const model = new LlamaModel({
    modelPath: path.join(__dirname, "bigtrans-13b.ggmlv3.q5_0.bin")
});

class LLamaTranslate {
    _getFilesToTranslate() {
        const promised = new Promise(async (resolve) => {
            const files = await glob('{./input/**/*.html,./input/**/*.js,./input/**/*.md,./input/**/*.java,./input/**/*.sql}', { ignore: 'node_modules/**' });
            resolve(files);
        })
        

        return promised;
    }

    _matchAll(pattern, data, ignoredWords) {
        const matchedAll = data.matchAll(pattern);
        let matchedAllArr = Array.from(matchedAll)

        ignoredWords.forEach(ignoredWord => {
            matchedAllArr = matchedAllArr.filter((value) => value != ignoredWord);
        });

        return matchedAllArr;
    }

    async translator(file) {
        let data = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });

        console.log('Translating: ', file)

        let keepWorking = true;
        const pattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]+/g;
        let ignoredWords = [];

        while (keepWorking) {
            const matchedAllArr = this._matchAll(pattern, data, ignoredWords);

            if (matchedAllArr.length) {
                const answer = await this._translate(matchedAllArr[0][0]);

                if (!answer.translated) {
                    ignoredWords.push(answer.content);
                }
    
                data = data.replace(matchedAllArr[0][0], answer.content);
            } else {
                keepWorking = false; 
            }
        }

        fs.writeFileSync(file, data);
    }

    _findAndReplace() {
        var q = new Queue({ concurrency: 1, autostart: true });

        this._getFilesToTranslate().then((files) => {
            files.forEach((file) => {
                q.push(async (cb) => { 
                    await this.translator(file);
                    cb();
                });
            });
        });
    }

    async _translate(q) {
        const q1 = "Please translate the following text to english: " + q;
        console.log("Translate: " + q1);

        const context = new LlamaContext({model});
        const session = new LlamaChatSession({context});
        let isTranslated = true;

        let a1 = await session.prompt(q1);

        a1 = a1.replaceAll('Please translate the following text to english: ', '');
        a1 = a1.replaceAll('You are a helpful, respectful and honest assistant. Always answer as helpfully as possible.', '')

        if (!a1.length) {
            a1 = q;
        }

        if (a1 === q) {
            isTranslated = false;
        }

        const answer = {
            content: a1,
            translated: isTranslated
        }

        console.log("AI: " + a1);

        return answer;
    }

    run() {
        this._findAndReplace();
    }

}

new LLamaTranslate().run();