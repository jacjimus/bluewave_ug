import handlebars from 'handlebars';

let paymentFailure = `
    <div>
        <p>Hi {{name}},</p>
        <p>We were unable to process your payment for the amount for the following reason:</p>
        <p style="color: black;">{{response}}</p>
         </p>
        <p>Thanks</p>
        <p>Your Team</p>
    </div>
`;

const paymentFailureTemplate = handlebars.compile(paymentFailure);

export default paymentFailureTemplate;
