const template = (name, code) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
        >
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        >
    
        <style>
          body {
            font-family: "Roboto", sans-serif;
          }
    
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
    
          .template {
            width: 100%;
            padding: 2.5rem;
            background-color: #e7e7e7;
          }
    
          .template__logo {
            margin-bottom: 2.5rem;
            text-align: center;
            font-size: 35px;
          }
    
          .template__inner-wrapper {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 2.5rem;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
            background-color: white;
          }
    
          .template__title {
            margin-bottom: 2rem;
            text-align: center;
            font-size: 22px;
            font-weight: 400;
            color: #464646;
          }
    
          .template__main-text {
            width: 100%;
            max-width: 350px;
            margin: 0 auto;
            margin-bottom: 2rem;
            font-size: 16px;
            text-align: center;
            color: #5e5e5e;
          }
    
          .template__code {
            width: 250px;
            margin: 0 auto;
            margin-bottom: 3rem;
            padding: 1.2rem 1.5rem;
            font-family: inherit;
            font-size: 18px;
            text-align: center;
            color: white !important;
            background-color: #3d89ee;
          }

          .template__secondary-text {
            text-align: center;
            font-size: 14px;
            color: #6d6d6d;
          }

          .template__secondary-text small {
            display: inline-block;
            margin-top: 1rem;
            text-align: center;
            color: #c9c8c8
          }
        </style>
    
      </head>
    
      <body>
        <div class="template">
          <h1 class="template__logo">Logo</h1>
          <div class="template__inner-wrapper">
            <h3 class="template__title">Verify your email address</h3>
            <p class="template__main-text">
              Hello ${name}. Use the next code to verify your email address
              <br />
              and confirm the creation or your new account:
            </p>
            <h3 class="template__code">
              ${code}
            </h3>
            <div class="template__secondary-text">
              <small>Desarrollado por Jesús Guzmán | 2021 - Todos los Derechos Reservados</small>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

module.exports = template;