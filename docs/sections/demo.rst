Demo
============

The VERA Unity plugin includes a simple **Demo Scene** to help you get started with logging data in Unity and uploading it to the VERA portal. 
This demo scene is a good way to test if your VERA setup is working correctly, and become introduced to the basic functionality of the VERA suite of tools.

Necessary Setup
--------------------------

Before continuing, ensure you have completed the steps in the `Installation <installation.html>`_ and `Setup <setup.html>`_ sections.
These sections ensure your Unity project is properly set up with the VERA plugin and authenticated with your VERA web account.

As a new user of VERA on the VERA web portal, you will be provided with a preset default demo experiment.
This experiment is automatically created for you when you first log in to the VERA web portal.
It should be named **Demo Experiment**, followed by your email.

   .. image:: /_static/DemoExpDashboard.png
      :alt: Demo experiment on the dashboard
      :width: 500px
      :align: center

If you do not see this demo experiment, you can create a new one by following the steps below. Skip these steps if you already have a demo experiment set up.
Before following these steps, it may be useful to review the `Web Portal: Overview <web_overview.html>`_ section for details on creating experiments.

1. On the dashboard of the VERA web portal, click on **Create New Experiment**.

2. Continue past the instructions by clicking **Next**.

3. Name your experiment **Demo Experiment** (or any name you prefer). Experiment names must be unique within your account, so it may be useful to append your email to the name to ensure clarity.

4. Fill out the rest of the form as you see fit, or leave it blank.

5. Under the **Participant File Management** section, click the **Add New File** button to create a new file.

   - Name the file **PlayerTransforms** (use this exact name - it is important for the demo scene).
   - Set the extension to **CSV**.
   - Add a new column by using the **CSV Column Metadata Configuration** section:

      - Name it **Transform**.
      - Set the data type to **Transform**.
      - Click **Add Column**.

   - Your file should be named *PlayerTransforms*, have an extension type of *CSV*, and have three total columns listed in the *CSV Column Metadata Configuration* section, one named *ts* in column 1, one named *eventId* in column 2, and one named *Transform* in column 3.
   - Click **Save** to create the file.

6. Click **Add New File** to add another new file.

   - Name it **CubeRotation**. Set the extension to **CSV**.
   - Add two new columns:

      - A column named **Message** with a data type of **String**.
      - A column named **Rotation** with a data type of **String**.

7. At the bottom of this form, click the **Submit** button to create your experiment.

In short, the demo experiment should have two CSV file types:

- **PlayerTransforms** with one added column named **Transform** of data type **Transform**.
- **CubeRotation** with two added columns named **Message** and **Rotation**, both of data type **String**.

Opening the Scene
----------------------

Once you have found or created your demo experiment, open a Unity project which has the VERA Unity plugin installed.
If you do not yet have a Unity project set up, refer to the `Installation <installation.html>`_ and `Setup <setup.html>`_ sections for guidance.

1. In the Unity menu bar, navigate to the **VERA** tab and select **Settings**. Ensure your Unity session is authenticated with your VERA account. For more details, see the `Setup <setup.html>`_ section.

2. In the **VERA Settings** window, select your active experiment from the dropdown menu. Choose the demo experiment you just found or created. If you do not see your experiment in the dropdown, try clicking the **Refresh Experiments** button.

3. In the **Project** window, navigate to the `Packages` > `VERA` > `Samples` folder. Open the scene named `DemoScene`.

   .. image:: /_static/NavigateToDemoScene.png
      :alt: Navigate to DemoScene
      :width: 500px
      :align: center

For more details on navigating Unity's Project window, refer to the `Unity Manual on the Project Window <https://docs.unity3d.com/Manual/ProjectView.html>`_.

Once you open the demo scene, you should see a simple setup with a cube and a camera rig.
This scene is designed to demonstrate how to log data in Unity and upload it to the VERA.

   .. image:: /_static/DemoScene.png
      :alt: View of the DemoScene
      :width: 500px
      :align: center

Running the Scene
------------------------

Once you have the demo scene open, you can run it to test your setup. Click the **Play** button in Unity to start the scene.

   .. image:: /_static/UnityPlayButton.png
      :alt: The Unity play button
      :width: 300px
      :align: center

As the scene runs, you will see the cube rotating and moving around the scene. 
The VERA plugin will automatically log the position and rotation of the cube, as well as the transforms of the camera rig and controllers, to the VERA portal.
After a few seconds, a window will appear indicating that the data has been submitted to the VERA portal.

   .. image:: /_static/DataSubmitted.png
      :alt: Data submission confirmation
      :width: 300px
      :align: center

Return to the VERA web portal. Open the demo experiment you created earlier.
Refresh the page, and you should see a newly submitted data entry.

   .. image:: /_static/DemoResult.png
      :alt: A result participant for the demo scene
      :width: 500px
      :align: center

Click the **View** button to see the logged data.

   .. image:: /_static/DemoResult2.png
      :alt: A result participant's data for the demo scene
      :width: 500px
      :align: center

Congratulations! You have successfully logged data from Unity into the VERA portal using the demo scene.

An Explanation of the Demo
---------------------------------

The demo scene is designed to showcase the basic functionality of the VERA Unity plugin.

The scene itself is made of a few simple components:

- **XR Rig**: This is the camera rig that represents the player's viewpoint in the scene. It includes the main camera and controllers. The transform of this rig, including the headset and controllers, is logged to the VERA portal intermittently.

   .. image:: /_static/DemoXrRig.png
      :alt: The XR Rig in the demo scene
      :width: 300px
      :align: center

- **Demo Cube**: A simple cube that rotates and translates around the scene. The rotation of this cube is logged to the VERA portal each frame, alongside a simple message indicating the current frame.

   .. image:: /_static/DemoCube.png
      :alt: The demonstrative cube in the demo scene
      :width: 300px
      :align: center

- **VERA Logger**: The logging of these above components occurs through the **VERALogger** script, which is attached to the **VERALogger** GameObject in the scene.

   .. image:: /_static/DemoVeraLogger.png
      :alt: The VERA Logger in the demo scene
      :width: 300px
      :align: center

This **VERA Logger** is the central component that connects your Unity project to the VERA portal and handles data logging.
Without a VERA Logger in your scene, no data will be logged to the VERA portal, and any calls to record data will fail.

The VERA Logger is the only necessary component to log data in Unity.
Additional optional components included in this demo scene include the **Upload Notification** game object, 
which provides a visual pop-up when data is fully uploaded, and the **In-Game Debug Log**, which displays a live feed of the
Unity console in-session.

Details of the Demo
--------------------------

The demo scene uses the **VERALogger** to record the transform of the XR Rig and the rotation of the cube. Below is a brief walkthrough on how this process actually occurs, and how to replicate it yourself.

First, read through the following overviews of various VERA concepts:

1. **Accessing the VERA Logger**:

   - The **VERALogger** script is responsible for connecting to the VERA web portal, and logging participant data.
   - It is a singleton, meaning there is only one instance of it in the scene, and it can be accessed globally via `VERALogger.Instance`.
   - Simply by adding the VERALogger script to a GameObject in your scene, you can start logging data.

2. **File Types**:

   - The demo scene uses two CSV file types: **PlayerTransforms** and **CubeRotation**.
   - Each file type represents a single CSV file which the logger will write to.
   - The **PlayerTransforms** file logs the transform of the XR Rig, while the **CubeRotation** file logs the rotation of the cube along with a message.
   - These file types are defined in the VERA portal when creating or editing an experiment. For more details on setting up these file types, see the `Web Portal: Overview <web_overview.html>`_ section.

3. **File Types as C# Classes**:

   - Upon selecting an active experiment, C# code will automatically be generated for each file type, one C# class per file type.
   - These classes are named according to the file type, prefixed by the phrase **"VERAFile_"**.
   - For example, the **PlayerTransforms** file type will generate a class named `VERAFile_PlayerTransforms`.

4. **Preprocessor Directives**:

   - Alongside each file type class, there is a single defined preprocessor directive.
   - For example, the **PlayerTransforms** file type will have a preprocessor directive named `VERAFile_PlayerTransforms`.
   - This directive will only be defined if the file type's C# code exists.
   - As such, you can use this directive to conditionally compile code that interacts with the file type.
   - For more details on preprocessor directives, refer to the `Unity Manual on Preprocessor Directives <https://docs.unity3d.com/Manual/PlatformDependentCompilation.html>`_.

For more details on these VERA concepts, refer to the `Unity Plugin: Overview <unity_overview.html>`_ section.

Next, let's take a look at how the demo scene actually uses these concepts to log data:

1. **Logging the XR Rig Transform**:

   - Open the **VERADemoTransformsLogger.cs** file (`Packages` > `VERA` > `Runtime` > `Samples` > `Scripts`).
   - In this file, you will find the code responsible for logging the XR Rig's transform.
   - Look for the `Update()` function, which is called every frame. In particular, focus on lines 76 through 78:

     .. code-block:: csharp

        #if VERAFile_PlayerTransforms
            VERAFile_PlayerTransforms.CreateCsvEntry(1, mainCamera.transform);
        #endif

   - Notice the use of the preprocessor directive `VERAFile_PlayerTransforms`. This directive ensures that the code inside it is only compiled if the **PlayerTransforms** file type exists.
   - We then make a direct call to the `VERAFile_PlayerTransforms` class. This class is code generated by VERA for the **PlayerTransforms** file type.
   - We call the `CreateCsvEntry` function, passing in an Event ID of `1` and the transform of the main camera.
   - This function will create a new entry in the **PlayerTransforms** CSV file with the current timestamp, the Event ID, and the transform of the main camera.
   - Feel free to explore the rest of this demonstrative script to see how it logs data.

2. **Logging the Cube Rotation**:

   - Open the **VERADemoCubeLogger.cs** file (`Packages` > `VERA` > `Runtime` > `Samples` > `Scripts`).
   - In this file, you will find the code responsible for logging the cube's rotation.
   - Look for the `LogRotation` function, which is called every frame (called from `Update`). In particular, focus on lines 62 through 64:

     .. code-block:: csharp

         #if VERAFile_CubeRotation
            VERAFile_CubeRotation.CreateCsvEntry(1, "Data Entry" + logCount, transform.rotation.ToString());
         #endif

   - Similar to the previous example, we use the preprocessor directive `VERAFile_CubeRotation` to conditionally compile this code.
   - We then call the `VERAFile_CubeRotation.CreateCsvEntry` function, passing in an Event ID of `1`, a message string, and the rotation of the cube as a string.
   - Notice how the number of parameters is different from the previous example. This is because the **CubeRotation** file type has different columns defined in the VERA portal.
   - This function will create a new entry in the **CubeRotation** CSV file with the current timestamp, the Event ID, the message, and the rotation of the cube.

3. **Submitting the Logs**:

   - The VERA Logger automatically handles the submission of logs to the VERA portal.
   - Logs are periodically synced with the web portal, ensuring no data is lost.
   - You can manually trigger a submission by calling the `SubmitCSV` function of a particular file type in your code, but this is not necessary.

      .. code-block:: csharp

         #if VERAFile_CubeRotation
            VERAFile_CubeRotation.SubmitCSV();
         #endif

4. **Finalizing a Participant's Session**:

   - Open the **VERAAutoSubmitter.cs** file (`Packages` > `VERA` > `Runtime` > `Scripts` > `Other`).
   - This script is included in the demo scene, attached to the `VERALogger` GameObject.
   - It automatically submits the logs and finalizes the participant's session after a set amount of time (default is 10 seconds).
   - See the `WaitThenSubmitCSV(float timeToDelay)` coroutine, in particular lines 27 and 28:

     .. code-block:: csharp

         VERALogger.Instance.SubmitAllCSVs();
         VERALogger.Instance.FinalizeSession();

   - The first line calls the VERALogger to submit all CSV files; this ensures all data is up-to-date and submitted to the VERA portal.
   - The second line finalizes the participant's session, marking it as complete in the VERA portal. This prevents any new data from being recorded.
   - The `FinalizeSession` function is important to ensure a participant's session is properly closed and can be analyzed later.

These are all the necessary components to understand and replicate the demo scene's functionality. 
For more details on specifics of how to use the VERA Logger, file types, and the VERA plugin as a whole, refer to the `Unity Plugin: Overview <unity_overview.html>`_ section.
For more details on the usage of the VERA web portal, refer to the `Web Portal: Overview <web_overview.html>`_ section.