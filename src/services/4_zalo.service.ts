import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';
import { config } from '../config';

interface ZaloTextMessage {
  recipient: {
    user_id: string;
  };
  message: {
    text: string;
  };
}

interface ZaloImageMessage {
  recipient: {
    user_id: string;
  };
  message: {
    attachment: {
      type: 'template';
      payload: {
        template_type: 'media';
        elements: Array<{
          media_type: 'image';
          attachment_id: string;
        }>;
      };
    };
  };
}

class ZaloService {
  private readonly API_URL = 'https://openapi.zalo.me/v3.0/oa';
  private readonly UPLOAD_URL = 'https://openapi.zalo.me/v2.0/oa/upload/image';

  /**
   * Verify Zalo webhook signature
   */
  verifySignature(body: string, signature: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', config.zaloAppSecret);
      hmac.update(body);
      const calculatedSignature = hmac.digest('hex');

      return calculatedSignature === signature;
    } catch (error) {
      console.error('[Zalo] Signature verification error:', error);
      return false;
    }
  }

  /**
   * Send text message to user
   */
  async sendTextMessage(userId: string, text: string): Promise<boolean> {
    try {
      const message: ZaloTextMessage = {
        recipient: {
          user_id: userId,
        },
        message: {
          text,
        },
      };

      const response = await axios.post(`${this.API_URL}/message`, message, {
        headers: {
          'Content-Type': 'application/json',
          access_token: config.zaloAccessToken,
        },
      });

      if (response.data.error === 0) {
        console.log(`[Zalo] Text message sent to ${userId}`);
        return true;
      } else {
        console.error('[Zalo] Send text message error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('[Zalo] Send text message failed:', error);
      return false;
    }
  }

  /**
   * Send image message to user
   */
  async sendImageMessage(userId: string, imageBuffer: Buffer): Promise<boolean> {
    try {
      // Step 1: Upload image to Zalo
      const attachmentId = await this.uploadImage(imageBuffer);
      if (!attachmentId) {
        console.error('[Zalo] Failed to upload image');
        return false;
      }

      // Step 2: Send image message with attachment ID
      const message: ZaloImageMessage = {
        recipient: {
          user_id: userId,
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'media',
              elements: [
                {
                  media_type: 'image',
                  attachment_id: attachmentId,
                },
              ],
            },
          },
        },
      };

      const response = await axios.post(`${this.API_URL}/message`, message, {
        headers: {
          'Content-Type': 'application/json',
          access_token: config.zaloAccessToken,
        },
      });

      if (response.data.error === 0) {
        console.log(`[Zalo] Image message sent to ${userId}`);
        return true;
      } else {
        console.error('[Zalo] Send image message error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('[Zalo] Send image message failed:', error);
      return false;
    }
  }

  /**
   * Upload image to Zalo and get attachment ID
   */
  private async uploadImage(imageBuffer: Buffer): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: 'calendar.png',
        contentType: 'image/png',
      });

      const response = await axios.post(this.UPLOAD_URL, formData, {
        headers: {
          ...formData.getHeaders(),
          access_token: config.zaloAccessToken,
        },
      });

      if (response.data.error === 0 && response.data.data?.attachment_id) {
        console.log('[Zalo] Image uploaded successfully:', response.data.data.attachment_id);
        return response.data.data.attachment_id;
      } else {
        console.error('[Zalo] Upload image error:', response.data);
        return null;
      }
    } catch (error) {
      console.error('[Zalo] Upload image failed:', error);
      return null;
    }
  }

  /**
   * Send typing indicator (optional, for better UX)
   */
  async sendTypingIndicator(userId: string): Promise<void> {
    try {
      await axios.post(
        `${this.API_URL}/message`,
        {
          recipient: {
            user_id: userId,
          },
          sender_action: 'typing_on',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            access_token: config.zaloAccessToken,
          },
        }
      );
    } catch (error) {
      // Ignore errors for typing indicator
      console.log('[Zalo] Typing indicator error (ignored)');
    }
  }
}

export const zaloService = new ZaloService();
