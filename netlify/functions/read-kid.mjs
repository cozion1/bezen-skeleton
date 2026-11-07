/**
 * netlify/functions/read-kid.mjs
 *
 * Netlify Function for the kid-message app.
 * Three lines: import the skeleton handler, import the profile, export the handler.
 *
 * Covers: Req 1.4, 8.1–8.4
 */

import { makeHandler } from '../../skeleton/handler.mjs';
import profile from '../../kid-message/profile.mjs';

export default makeHandler(profile);
