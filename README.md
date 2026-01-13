# Think Fast, Talk Smart: AI Communication Coach 🎤

A web-based interactive workshop designed to improve spontaneous speaking skills using AI. This application guides users through four specific activities based on "Think Fast, Talk Smart" techniques.

## 🚀 Features

- **AI Workshop Coach**: Powered by LLMs (Llama 3, Gemini, Mistral) via OpenRouter.
- **4 Interactive Activities**:
  - **Shout the Wrong Name**: Rapid-fire object naming game with AI-generated images.
  - **Give an Imaginary Gift**: Improvisational gifting exercise.
  - **Spelling Everything**: Conversation practice where every word must be spelled out.
  - **Selling with Structure**: Persuasion practice using frameworks like "Problem-Solution-Benefit".
- **Voice Interaction**:
  - **Speech-to-Text (STT)**: Speak your answers using the microphone.
  - **Text-to-Speech (TTS)**: Hear the Coach's feedback aloud.
- **Visuals**: Dynamic image generation using Pollinations AI.

## 🛠️ Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/say-wrong-name.git
    cd say-wrong-name
    ```

2.  **Configuration**:
    - Rename `config.example.js` to `config.js`.
    - Open `config.js` and paste your OpenRouter API Key:
      ```javascript
      const CONFIG = {
          API_KEY: "sk-or-your-actual-api-key-here"
      };
      ```
    - *Note: You can get a free key from [OpenRouter.ai](https://openrouter.ai/).*

3.  **Run the App**:
    - Simply open `index.html` in your browser.
    - Or run it via a local server (e.g., Live Server in VS Code, XAMPP, Python SimpleHTTPServer).

## 📂 Project Structure

- `index.html`: Main entry point and UI structure.
- `style.css`: All styling, animations, and responsive design.
- `script.js`: Core logic, AI integration, Voice API handling, and game management.
- `config.js`: (Ignored by Git) Stores your private API key.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
