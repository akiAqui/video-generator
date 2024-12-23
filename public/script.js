const generateVideo = async () => {
  try {
    const response = await fetch("http://localhost:3000/generate-video");

    if (!response.ok) {
      throw new Error("Failed to generate video");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.mp4";
    document.body.appendChild(a);
    a.click();
    a.remove();

    console.log("Video download initiated.");
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to generate video.");
  }
};

document.getElementById("generate-video")?.addEventListener("click", generateVideo);

