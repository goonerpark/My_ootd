package com.ootd.backend.closet.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ClosetImageStorageClient {
    String store(MultipartFile file);
}
