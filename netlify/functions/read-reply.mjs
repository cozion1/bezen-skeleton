/**
 * netlify/functions/read-reply.mjs
 *
 * Netlify Function for the reply-reader app.
 * Three lines: import the skeleton handler, import the profile, export the handler.
 *
 * Covers: Req 1.4, 7.1–7.3
 */

import { makeHandler } from '../../skeleton/handler.mjs';
import profile from '../../reply-reader/profile.mjs';

export default makeHandler(profile);
