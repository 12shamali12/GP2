import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { v4 as uuid } from "uuid";
import { ChatService } from "./chat.service";
import { ListMessagesDto, SendMessageDto, StartMessageDto } from "./dto";

const UPLOAD_DIR = join(process.cwd(), "uploads", "chat");

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("conversations")
  listConversations(@Query("identifier") identifier: string) {
    if (!identifier) throw new BadRequestException("identifier required");
    return this.chatService.listConversations(identifier);
  }

  @Get("unread-count")
  unreadCount(@Query("identifier") identifier: string) {
    if (!identifier) throw new BadRequestException("identifier required");
    return this.chatService.unreadConversationsCount(identifier);
  }

  @Get("search")
  searchUsers(@Query("q") q: string, @Query("identifier") identifier?: string) {
    if (!q) return [];
    return this.chatService.searchUsers(q, identifier);
  }

  @Post("start")
  start(@Body() dto: StartMessageDto) {
    return this.chatService.startOrSend(dto);
  }

  @Get(":id/messages")
  listMessages(@Param("id") id: string, @Query() dto: ListMessagesDto) {
    return this.chatService.listMessages(id, dto.identifier);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @Body("identifier") identifier: string) {
    return this.chatService.markRead(id, identifier);
  }

  @Post(":id/messages")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
        filename: (_req, file, cb) => {
          cb(null, `${uuid()}${extname(file.originalname || "")}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(new BadRequestException("Images only"), false);
        cb(null, true);
      },
    })
  )
  async sendMessage(
    @Param("id") id: string,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const imageUrl = file ? `/uploads/chat/${file.filename}` : undefined;
    return this.chatService.sendMessage(id, dto, imageUrl);
  }
}
