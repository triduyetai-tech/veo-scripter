
type Translation = {
  [key: string]: string;
};

type Translations = {
  en: Translation;
  vi: Translation;
};

export const translations: Translations = {
  en: {
    // Header
    title: 'Veo Character Scripter',
    subtitle: 'Create consistent character video scripts with AI.',
    // API Key Screen
    welcome: 'Welcome!',
    apiKeyPrompt: 'This application uses the Veo 3.1 video generation model. To proceed, please select your Google AI Studio API key. This is a necessary step for video generation.',
    billingInfo: 'For information about billing, please visit',
    selectApiKey: 'Select API Key',
    // Main App - Left Panel
    defineCharacterTitle: '1. Define Your Character',
    characterDescriptionPlaceholder: 'e.g., A cheerful young astronaut named Alex with a bright blue suit and a curious, adventurous personality.',
    videoDurationTitle: 'Desired Video Duration (minutes)',
    aspectRatioTitle: 'Aspect Ratio',
    landscape: 'Landscape',
    portrait: 'Portrait',
    characterReferenceImageTitle: 'Character Reference Image',
    uploadImage: 'Upload an image',
    dragAndDrop: 'or drag and drop',
    imageFormatInfo: 'PNG, JPG up to 10MB',
    generateScriptTitle: '2. Generate Script from an Idea (Optional)',
    storyIdeaPlaceholder: 'e.g., Alex the astronaut discovers a glowing plant that communicates with music.',
    generateScriptButton: 'Generate Script',
    generatingScriptButton: 'Generating...',
    editScenesTitle: '3. Review & Edit Scenes',
    addScene: 'Add Scene',
    scenePlaceholder: 'Describe scene {index}...',
    generatePromptsButton: 'Generate Prompts',
    generatingPromptsButton: 'Generating Prompts...',
    generateVideoButton: 'Generate Video',
    // Main App - Right Panel
    storyboardTitle: '4. Generated Storyboard',
    storyboardPlaceholder: 'Your generated prompts and videos will appear here.',
    sceneTitle: 'Scene {index}',
    generatedPromptTitle: 'Generated Prompt:',
    videoPlaceholder: 'Video will appear here',
    generatingVideo: 'Generating video...',
    generatingVideoSubtext: 'This may take a few minutes.',
    videoFailed: 'Video Generation Failed',
    // Loading & Alerts
    invalidApiKeyError: 'API Key is invalid. Please select a valid key.',
    genericError: 'An error occurred: {message}',
    formValidationError: 'Please provide a character description, a reference image, and a description for every scene.',
    storyIdeaRequiredError: 'Please enter a story idea to generate a script.',
  },
  vi: {
    // Header
    title: 'Tạo Kịch Bản Nhân Vật Veo',
    subtitle: 'Tạo kịch bản video với nhân vật nhất quán bằng AI.',
    // API Key Screen
    welcome: 'Chào mừng!',
    apiKeyPrompt: 'Ứng dụng này sử dụng mô hình tạo video Veo 3.1. Để tiếp tục, vui lòng chọn khóa API Google AI Studio của bạn. Đây là một bước cần thiết để tạo video.',
    billingInfo: 'Để biết thông tin về thanh toán, vui lòng truy cập',
    selectApiKey: 'Chọn Khóa API',
    // Main App - Left Panel
    defineCharacterTitle: '1. Xác định Nhân vật của bạn',
    characterDescriptionPlaceholder: 'VD: Một phi hành gia trẻ vui vẻ tên Alex trong bộ đồ màu xanh dương sáng, có tính cách tò mò và thích phiêu lưu.',
    videoDurationTitle: 'Thời lượng Video mong muốn (phút)',
    aspectRatioTitle: 'Tỷ lệ khung hình',
    landscape: 'Ngang',
    portrait: 'Dọc',
    characterReferenceImageTitle: 'Hình ảnh tham chiếu nhân vật',
    uploadImage: 'Tải ảnh lên',
    dragAndDrop: 'hoặc kéo và thả',
    imageFormatInfo: 'PNG, JPG tối đa 10MB',
    generateScriptTitle: '2. Tạo Kịch Bản từ Ý Tưởng (Tùy chọn)',
    storyIdeaPlaceholder: 'VD: Phi hành gia Alex phát hiện một loài cây phát sáng có thể giao tiếp bằng âm nhạc.',
    generateScriptButton: 'Tạo Kịch Bản',
    generatingScriptButton: 'Đang tạo...',
    editScenesTitle: '3. Xem lại & Chỉnh sửa Cảnh',
    addScene: 'Thêm cảnh',
    scenePlaceholder: 'Mô tả cảnh {index}...',
    generatePromptsButton: 'Tạo Gợi Ý',
    generatingPromptsButton: 'Đang tạo Gợi Ý...',
    generateVideoButton: 'Tạo Video',
    // Main App - Right Panel
    storyboardTitle: '4. Kịch bản đã tạo',
    storyboardPlaceholder: 'Các gợi ý và video đã tạo của bạn sẽ xuất hiện ở đây.',
    sceneTitle: 'Cảnh {index}',
    generatedPromptTitle: 'Gợi ý đã tạo:',
    videoPlaceholder: 'Video sẽ xuất hiện ở đây',
    generatingVideo: 'Đang tạo video...',
    generatingVideoSubtext: 'Quá trình này có thể mất vài phút.',
    videoFailed: 'Tạo Video Thất bại',
    // Loading & Alerts
    invalidApiKeyError: 'Khóa API không hợp lệ. Vui lòng chọn một khóa hợp lệ.',
    genericError: 'Đã xảy ra lỗi: {message}',
    formValidationError: 'Vui lòng cung cấp mô tả nhân vật, hình ảnh tham chiếu và mô tả cho mọi cảnh.',
    storyIdeaRequiredError: 'Vui lòng nhập ý tưởng câu chuyện để tạo kịch bản.',
  },
};
