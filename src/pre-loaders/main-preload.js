window.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');

    const disableTextSelection = process.env.DISABLE_TEXT_SELECTION === 'true';

    let cssContent = `
        ::-webkit-scrollbar {
            width: 14px;
            height: 14px;
        }
        ::-webkit-scrollbar-track {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 7px;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.6);
            animation: pulseTrack 2s infinite alternate;
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #ff0077, #7700ff);
            border-radius: 7px;
            box-shadow: 0 0 20px rgba(255, 0, 119, 0.8), inset 0 0 10px rgba(119, 0, 255, 0.7);
            animation: glowThumb 1.5s infinite alternate;
            transition: background 0.3s, box-shadow 0.3s;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #7700ff, #ff0077);
            box-shadow: 0 0 25px rgba(255, 0, 119, 1), inset 0 0 15px rgba(119, 0, 255, 1);
        }
        ::-webkit-scrollbar-corner {
            background: transparent;
        }
        @keyframes pulseTrack {
            0% {
                background: linear-gradient(135deg, #1a1a2e, #1c233a);
            }
            100% {
                background: linear-gradient(135deg, #1a1a2e, #0f172a);
            }
        }
        @keyframes glowThumb {
            0% {
                box-shadow: 0 0 20px rgba(255, 0, 119, 0.8), inset 0 0 10px rgba(119, 0, 255, 0.7);
            }
            100% {
                box-shadow: 0 0 25px rgba(255, 0, 119, 1), inset 0 0 15px rgba(119, 0, 255, 1);
            }
        }
    `;

    if (disableTextSelection) {
        cssContent += `
            * {
                user-select: none;
                -webkit-user-select: none;
            }
        `;
    }

    style.textContent = cssContent;
    document.head.appendChild(style);
});
