WebXR Guide
============

**WebXR** is the primary interface used by VERA to run your XR experiments in a web browser.
In this way, participants can access your experiments without needing to download or install any additional software.

This section provides a guide on how to build and run your experiments in WebXR using the VERA tools, including how to configure your Unity project for WebXR compatibility and how to upload your experiments to the VERA portal.

What Is WebXR?
----------------

WebXR is a web API which allows the creation of immersive experiences that run directly in a web browser.
These WebXR experiences can be accessed without needing to download or install any additional software, making them highly accessible and easy to use.

WebXR is built on top of the WebGL library, which allows easily rendering 3D graphics in a web browser.
It is built to integrate easily with standard web technologies, such as HTML, CSS, and JavaScript.

Unity does not have built-in support for WebXR, but there are various Unity plugins available which do provide this support.
The VERA Unity plugin interfaces directly with the `Unity WebXR Export plugin <https://github.com/De-Panther/unity-webxr-export>`_, a plugin which allows seamless export of Unity projects to WebXR.
This WebXR Export plugin is installed automatically when exporting from the VERA Unity plugin, and is used to build your Unity project for WebXR.

Once an experiment is built for WebXR, it is uploaded to the VERA portal and hosted as a WebXR experience.
Any hosted experiment can then be accessed by participants through a web browser, allowing them to participate in the experiment on their own devices without needing to download or install any additional software.

For more details on WebXR, refer to the `official WebXR documentation <https://immersiveweb.dev/>`_.

Building and Uploading Experiments for WebXR
------------------------------------------------

Once you are ready to export your Unity experiment for WebXR, follow these steps:

1. **Open the VERA Settings Window**: In Unity, open the **VERA Settings** window by navigating to `VERA > Settings` in the Unity menu bar.

2. **Click the Button**: In the VERA Settings window, if you are authenticated, you should see a **Build and Upload Experiment** button. Click this button to begin the build and upload process.

3. **Wait for Completion**: VERA will automatically install any dependencies, adjust any settings, and ensure the proper environment necessary for WebXR. You can monitor the process in the Unity debug console. If any error occurs along the way, it will be displayed in the console alongside instructions on how to resolve it. When the build is done, a dialogue will appear indicating that the build was successful.

That's it - you're done! Your experiment is now built for WebXR and uploaded to the VERA portal.

Exported WebXR experiments are not stored on your local machine - they are hosted on the VERA portal. As such, you don't need to worry about any cleanup, or managing locally built files on your system.

Note that the WebXR build process may take some time, depending on the size and complexity of your Unity project. It is recommended to ensure that your project is well-optimized for WebXR before building.

Additionally note that the experiment will be built *only for the currently active experiment set in the VERA Settings window*. 
If you wish to build a different experiment, you will need to select that experiment in the VERA Settings window before clicking the **Build and Upload Experiment** button.

Viewing and Running WebXR Experiments
--------------------------------------

Once your experiment is built for WebXR, you can obtain your experiment's unique URL from the VERA portal.
This URL can be shared with participants, who can then access your experiment directly in their web browser.

Navigate to the VERA portal, and find your experiment on the dashboard. Click the **Edit Experiment** button to view the experiment details.

At the bottom of the page, if the experiment has been successfully uploaded for WebXR, you should see a link under the section labelled **WebXR Link**.

  .. image:: /_static/WebXRLink.png
    :alt: The WebXR link in the VERA portal
    :width: 500px
    :align: center

If your experiment is multi-site, you will see a link for each site in the experiment.
For more details on managing multi-site experiments, refer to the `Multi-Site Management <multi-site.html>`_ section.

This link can be shared with participants, who can then access your experiment directly in their VR headset's web browser.
You can test your experiment by opening the link in a web browser on your own device.
When the link is opened, a new participant session will begin, and the experiment will start running.