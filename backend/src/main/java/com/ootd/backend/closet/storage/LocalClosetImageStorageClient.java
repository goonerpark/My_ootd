package com.ootd.backend.closet.storage;

import com.ootd.backend.closet.exception.ClosetImageStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.UUID;

@Component
public class LocalClosetImageStorageClient implements ClosetImageStorageClient {

    private final Path localRootDir;
    private final String urlPrefix;

    public LocalClosetImageStorageClient(
            @Value("${closet.image-storage.local-dir:uploads/closet-items}") String localDir,
            @Value("${closet.image-storage.url-prefix:http://localhost:8080/uploads/closet-items/}") String urlPrefix
    ) {
        this.localRootDir = Paths.get(localDir).toAbsolutePath().normalize();
        this.urlPrefix = urlPrefix;
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ClosetImageStorageException("image file is empty", null);
        }

        String extension = getExtension(file.getOriginalFilename());
        String savedFileName = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(localRootDir);
            Path destination = localRootDir.resolve(savedFileName);
            file.transferTo(destination);
            return urlPrefix + savedFileName;
        } catch (IOException ex) {
            throw new ClosetImageStorageException("failed to store closet image file", ex);
        }
    }

    private String getExtension(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "";
        }
        String clean = Objects.requireNonNull(originalFilename).trim();
        int lastDot = clean.lastIndexOf('.');
        if (lastDot < 0 || lastDot == clean.length() - 1) {
            return "";
        }
        String ext = clean.substring(lastDot);
        if (ext.length() > 10) {
            return "";
        }
        return ext;
    }
}
