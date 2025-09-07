# ThuliApp - Hackathon Project 🚀

## Overview 📝

ThuliApp is a mobile application that provides personalized style recommendations based on user preferences and a style quiz. It leverages a Python backend with machine learning capabilities to analyze user data and suggest relevant fashion items.

## Setup Instructions 🛠️

### Backend ⚙️

1.  Navigate to the `Backend` directory:

    ```bash
    cd Backend
    ```
2.  Create a virtual environment (optional but recommended):

    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:

    *   On Windows:

        ```bash
        venv/Scripts/Activate.ps1
        ```
    *   On macOS and Linux:

        ```bash
        source venv/bin/activate
        ```
4.  Install the required dependencies:

    ```bash
    pip install -r requirements.txt
    ```
5.  Run the backend application:

    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

### ThuliApp (Frontend) 📱

1.  Navigate to the `ThuliApp` directory:

    ```bash
    cd ThuliApp
    ```
2.  Install the required dependencies:

    ```bash
    npm install
    ```
3.  Start the Expo development server:

    ```bash
    npx expo start
    ```

    To clear cache:

    ```bash
    npx expo start -c
    ```

    This will open a web page in your browser (Expo DevTools). You can then choose to run the app on an Android emulator/device or an iOS simulator/device by pressing 'a' or 'i' respectively in the terminal, or by scanning the QR code with the Expo Go app on your physical device.

## Important Details ℹ️

*   **Dataset:** [iMaterialist (Fashion) 2020 at FGVC7](https://www.kaggle.com/competitions/imaterialist-fashion-2020-fgvc7/overview)
*   **Data Pipeline:** `data_pipeline.py` has all the details regarding the dataset extraction and intial Database setup.
*   **Database Configuration:** The project uses Supabase for database and bucket storage. The Supabase API keys are available in the Supabase dashboard. 🗄️
    The following tables are used:
    1.  `users` - For checking if the user has a valid account.
    2.  `initial_quiz_img` - Storing the initial quiz's images and its bucket storage link.
    3.  `quiz_pool_img` - Storing the refinement quiz's images and its bucket storage link.
    4.  `embedding_pool_img` - Storing the embedding's images and its bucket storage links.
    5.  `profiles` - Stores the taste of the user collected from the initial and refinement quizzes.
*   **Architecture:** The project uses a FastAPI backend (Python) and a React Native frontend. The backend provides API endpoints for data retrieval and processing, while the frontend provides the user interface. 🏛️
*   **Known Issues:**
    1.  Randomizing the refinement quiz can lead to reuse of data. (Solution: Should enable a check). ⚠️
    2.  Needs web scraping methodology to enhance the liveliness of the content. 🚧

*   **Authentication:** The project uses email/password authentication with email confirmation. 🔐

## Demo ✨

1. **Account SignUp** 🚀

    ![UserSignup.gif](UserSignup-ezgif.com-video-to-gif-converter.gif)
---
2. **Initial Quiz** 📝 (Is active only at the first signIn for intial curation)

    ![initialQuiz.gif](initialQuiz-ezgif.com-video-to-gif-converter.gif)
---
3. **Account Already Existing Scenario** ⚠️

    ![AccountExists.gif](AccountExists-ezgif.com-video-to-gif-converter.gif)
---
4. **Home Screen (aka Recommendation Viewer)** 🏠

    ![HomeScreen.gif](HomeScreen-ezgif.com-video-to-gif-converter.gif)
---
5. **Refinement Quiz (aka Style Quiz)** 💅

    ![refineQuiz.gif](refineQuiz-ezgif.com-video-to-gif-converter.gif)
---
6. **Dark/Light Mode (in settings page)** 🌗

    ![alt text](darkMode-ezgif.com-video-to-gif-converter.gif)
---
