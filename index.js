import {fileURLToPath} from "url";
import path from "path";
import {LlamaModel, LlamaContext, LlamaChatSession} from "node-llama-cpp";
import fs from "fs";
import { glob } from "glob";
import Queue from 'better-queue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const model = new LlamaModel({
    modelPath: path.join(__dirname, "bigtrans-13b.ggmlv3.q5_0.bin")
});

class LLamaTranslate {
    async _getFilesToTranslate() {
        const htmlfiles = await glob('./input/**/*.html', { ignore: 'node_modules/**' });

        return htmlfiles;
    }

    async translator(file) {
        let data = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });

        console.log('Translating: ', file)

        let keepWorking = true;
        const pattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]+/m;

        while (keepWorking) {
            const match = data.match(pattern);

            const translated = await this._translate(match[0]);

            data = data.replaceAll(match[0], translated);

            if (!match.length) {
                keepWorking = false;
            }
        }

        fs.writeFileSync(file, data);
    }

    async _findAndReplace() {
        const files = await this._getFilesToTranslate();

        var q = new Queue((file) => this.translator(file), { concurrent: 1 });

        files.forEach((file) => {
            q.push(file);
        })
    }

    async _translate(q) {
        const q1 = "Please translate the following text to english: " + q;
        console.log("Translate: " + q1);

        const context = new LlamaContext({model});
        const session = new LlamaChatSession({context});

        const a1 = await session.prompt(q1);
        console.log("AI: " + a1);

        if (!a1.length) {
            a1 = q1;
        }

        return a1;
    }

    async run() {
        await this._findAndReplace();
    }

}

new LLamaTranslate().run();