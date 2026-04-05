Installation
============
To use VERA, you need to install **Unity**, as well as the **VERA Unity package**. The following steps will guide you through this installation process, assuming you are starting from scratch.

**Unity** is a cross-platform game engine which provides a variety of tools used to develop VR applications. 
VERA leverages these tools to facilitate data collection in XR experiments.
The VERA framework is built as a Unity plugin, which means it integrates directly into the Unity environment, allowing you to log data from your Unity XR experiments seamlessly.

1. **Install Unity**:

   - If you already have Unity installed, you can skip this step. If not, follow these steps to install Unity.
   - Download and install **Unity Hub** from the `Unity Download Page <https://unity.com/download>`_.
   - Open Unity Hub. Install any version of Unity. VERA supports Unity versions **(2022.3.34f1)** or later; older versions might not work as expected.
   - For more information on installing Unity, refer to the `Unity Installation Guide <https://docs.unity3d.com/Manual/GettingStartedInstallingUnity.html>`_.

2. **Open a Unity Project**:

   - In Unity Hub, click on the **New Project** button.
   - Select the **3D** template and name your project (e.g., "VERA Project").
   - Click **Create** to open your new project in Unity.
   - If you already have an existing Unity project, you can skip this step and open your project directly in Unity.
   - For more information on creating a new project, refer to the `Unity Guide on New Projects <https://docs.unity3d.com/hub/manual/AddProject.html>`_.

3. **Install the VERA Unity Plugin**:

   - Download the **VERA Unity plugin** from the following link:
     `VERA Unity Plugin (Version 0.1.0) <https://sreal.ucf.edu/vera-portal/static/VERA-Unity-plugin-0.1.0.unitypackage>`_
   - Save the file to an easily accessible location and import it into Unity by selecting `Assets -> Import Package -> Custom Package` in the Unity menu bar.
   - For more information on importing packages, refer to the `Unity Manual on Importing Packages <https://docs.unity3d.com/Manual/AssetPackagesImport.html>`_.

4. **Ensure Proper Import**

   - VERA should now be installed in your Unity project. You should see a new folder named **VERA** in your `Packages` directory.
   - If you do not see this folder, ensure that the import was successful and that there were no errors during the import process.
   - This package import should automatically install all necessary dependencies. Ensure these dependencies are installed correctly by checking the **Package Manager** in Unity. These dependencies are as follows:

     - **XR Interaction Toolkit**: For handling XR interactions.
     - **VR Package**: For VR support in Unity.
     - **TextMeshPro (TMP) Essential Resources**: For text rendering in Unity.

Your Unity project is now set up with the VERA plugin. You can proceed to the `Setup <setup.html>`_ section to configure your Unity project to work with VERA.
