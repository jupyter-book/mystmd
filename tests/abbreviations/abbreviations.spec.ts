import { conversionTests } from '../framework'

import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

conversionTests(__dirname)
