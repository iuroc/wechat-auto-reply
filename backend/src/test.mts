import { getString } from './util/main.mjs'

if (getString({}, 'name') !== '') throw new Error()
if (getString(undefined, 'name') !== '') throw new Error()
if (getString({ name: 0 }, 'age') !== '') throw new Error()
if (getString({ name: 0 }, 'name') !== '0') throw new Error()
if (getString({ result: true }, 'result') !== 'true') throw new Error()