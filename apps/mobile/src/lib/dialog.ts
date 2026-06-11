/**
 * Cross-platform dialogs — rendered as a themed in-app modal (see DialogHost),
 * so confirmations and messages look the same on web and native.
 *
 * Call `notify`/`confirmAction` from anywhere; <DialogHost /> (mounted at the
 * app root) displays them.
 */
export { notify, confirmAction } from "./dialogStore";
