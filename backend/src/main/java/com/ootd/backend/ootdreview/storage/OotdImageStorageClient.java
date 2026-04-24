package com.ootd.backend.ootdreview.storage;

import org.springframework.web.multipart.MultipartFile;

public interface OotdImageStorageClient {
    String store(MultipartFile file);
}
