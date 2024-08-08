import generate2FactorEmailTemplate from './2FAEnabledEmailTemplate.js';
import generate2FAEnabledEmailTemplate from './2FAEnabledEmailTemplate.js';
import generateAccountDeletedConfirmationEmailTemplate from './accountDeletedConfirmationEmailTemplate.js';
import generateAccountDeletionStartedEmailTemplate from './accountDeletionStartedEmailTemplate.js';
import generateConfirmationEmailTemplate from './confirmationEmailTemplate.js';

const emailTemplates = {
    generate2FactorEmailTemplate,
    generate2FAEnabledEmailTemplate,
    generateAccountDeletedConfirmationEmailTemplate,
    generateAccountDeletionStartedEmailTemplate,
    generateConfirmationEmailTemplate
};

export default emailTemplates;
