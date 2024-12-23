import express, { Request, Response, RequestHandler } from "express";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

ffmpeg.setFfmpegPath(ffmpegPath || "");

const app = express();
const port = 3000;

const generateVideo: RequestHandler = async (req, res): Promise<void> => {
  try {
    const outputPath = path.join(__dirname, "../../output.mp4");
    const inputFiles = [
      path.join(__dirname, "../../public/frame01.png"),
      path.join(__dirname, "../../public/frame02.png"),
    ];

    // ファイルの存在チェック
    for (const file of inputFiles) {
      if (!existsSync(file)) {
        console.error(`Input file not found: ${file}`);
        res.status(404).send(`Input file not found: ${file}`);
        return;
      }
    }

    const tempFileList = path.join(__dirname, "../../file-list.txt");
    const repeatedFrames = [];
    
    // 各フレームに継続時間を指定
    for (let i = 0; i < 3; i++) {
      repeatedFrames.push(
        ...inputFiles.map(file => ({
          file: path.resolve(file),
          duration: 1  // 各フレームを1秒間表示
        }))
      );
    }
    //console.log("repeatedFrames=",repeatedFrames);
    
    // ファイルリストをffmpegのconcatフィルター形式で作成
    const fileListContent = repeatedFrames
      .map(frame => `file '${frame.file}'\nduration ${frame.duration}`)
      .join('\n');
    
    await fs.writeFile(tempFileList, fileListContent);
    console.log("tmpFileList=",tempFileList);
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(tempFileList)
        .inputOptions([
          "-f concat",
          "-safe 0"
        ])
        .outputOptions([
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-vf scale=716:410",  // 高さを2の倍数に調整
          "-framerate 30"       // 入力フレームレート
        ])
        .save(outputPath)
        .on("start", (commandLine) => {
          console.log("FFmpeg command: ", commandLine);
        })
        .on("stderr", (stderrLine) => {
          console.log("FFmpeg stderr: ", stderrLine);
        })
        .on("end", async () => {
          console.log("Video generated successfully.");
          //await fs.unlink(tempFileList).catch(console.error);
          res.download(outputPath);
          resolve();
        })
        .on("error", async (err: Error) => {
          console.error("Error generating video:", err);
          await fs.unlink(tempFileList).catch(console.error);
          res.status(500).send("Error generating video");
          reject(err);
        });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send("Unexpected error occurred");
  }
};

app.get("/generate-video", generateVideo);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
