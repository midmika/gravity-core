import directoryTree, {DirectoryTree} from "directory-tree";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {TDatabaseQueries} from "../AbstractDatabase";

const getQueries = (): TDatabaseQueries => {

    const tree: DirectoryTree = directoryTree(
        path.join(path.dirname(fileURLToPath(import.meta.url)), 'sql')
    )

    const obj: { [key: string]: {[key: string]: string} } = {}

    // @ts-ignore
    Object.values(tree.children).map((_) => {
        // @ts-ignore
        const name = _.name
        obj[name] = {}
        // @ts-ignore
        for(const i of _.children) {
            obj[name][i.name.replace('.sql', '')] = fs.readFileSync(i.path, 'utf8')
        }
    })

    return obj as TDatabaseQueries

}

export default getQueries