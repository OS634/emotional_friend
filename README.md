## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npx tsc`

To convert typescript files to javascript

### Reference

- https://www.youtube.com/watch?v=Js9BsBsczE8
- https://tailwindcss.com/


# How to run
- frontend
    - npm start
- backend
    - npm run dev

# file
```console
EMOTIONAL_FRIEND
├── backend
│   ├── ai
│   │   ├── models
│   │   │   └── pretrain-AffectNet-7.pth
│   │   └── emotion_detector.py
│   ├── launchpad
│   ├── node_modules
│   ├── uploads
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   ├── server.ts
│   └── tsconfig.json
├── frontend
│   ├── node_modules
│   ├── public
│   └── src
│       ├── components
│       │   ├── Chat.tsx
│       │   ├── ChatSidebar.css
│       │   ├── ChatSidebar.tsx
│       │   ├── emotionalChatbot.tsx
│       │   ├── EmotionDetection.tsx
│       │   ├── firebaseFunctions.tsx
│       │   └── Message.tsx
│       ├── App.css
│       ├── App.tsx
│       ├── firebase.ts
│       ├── index.tsx
│       ├── react-app-env.d.ts
│       └── styles.css
├── .dockerignore
├── .env
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── LaunchPad Project Idea.docx
├── package-lock.json
├── package.json
└── README.md
```